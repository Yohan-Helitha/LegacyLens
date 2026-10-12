# Legacy Lens — Backend Implementation Plan: Elder Content Capture Module

> Scope: Member A's module only (Content Capturing & Management, elder side). Each feature below is self-contained: a user story, the entities/DTOs it needs, how SOLID/OOP principles apply, a ready-to-use implementation prompt, and its test suite. Build in the order listed — later features depend on entities introduced earlier.

## One scope flag still worth confirming with your team

- **Elder Review & Rating vs. Trust Score**: treated as **separate** metrics below (Trust Score = activity-based level; Review & Rating = feedback-based, with both a numeric score and visible written reviews), since that's what the wireframe visually implies (both appear on the same profile screen as distinct stats). Flag if your team wants these merged into one number instead.

**Earnings/payout is confirmed frontend-only decoration for now** — no backend work in this plan (see the note where Feature 12 used to be).

---

## Shared foundation (already covered in earlier schema work)

These tables already exist from the earlier auth/profile schema and are referenced throughout: `users`, `user_roles`, `knowledge_holder_profiles`. This module adds: `content`, `job_requests`, `job_applications`, `elder_ratings`.

---

## Feature 1 — Content Recording Submission (audio/video)

**User story**: As an elder, I want to upload a recorded audio or video clip with a title so that it can be reviewed and published.

**Entities/DTOs**:
- `Content` entity: `id`, `knowledgeHolderId` (FK), `title`, `contentType` (enum: `AUDIO`, `VIDEO`, `TEXT`), `mediaUrl`, `status` (enum: `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `NEEDS_CHANGES`), `viewCount`, `createdAt`, `updatedAt`
- `ContentUploadRequestDto` (title, contentType, presigned-upload confirmation key)
- `ContentResponseDto`

**SOLID/OOP design**:
- Define a `ContentSubmissionService` interface with a single method `submit(ContentUploadRequestDto, UUID userId): ContentResponseDto` — Single Responsibility: this service only handles the act of submitting, not querying or scoring.
- Depend on an injected `MediaStorageClient` interface (not a concrete AWS S3 class) so the storage backend can be swapped without touching this service — Dependency Inversion.
- Use a `ContentTypeValidator` strategy interface with `AudioVideoValidator` and `TextValidator` implementations, selected via the `contentType` field — Open/Closed: adding a new content type later means adding a new strategy class, not editing existing ones.

**Implementation prompt**:
```
Implement a ContentController with POST /api/v1/content endpoint accepting a
ContentUploadRequestDto (title, contentType, mediaUrl). Inject a
ContentSubmissionService interface (impl: ContentSubmissionServiceImpl) via
constructor injection. The service validates the request using the appropriate
ContentTypeValidator strategy (selected via a Map<ContentType, ContentTypeValidator>
injected by Spring), persists a Content entity with status DRAFT via
ContentRepository (Spring Data JPA), and returns a ContentResponseDto. Do not
handle file bytes in this endpoint — mediaUrl is a reference to a file already
uploaded to storage via a presigned URL obtained from a separate endpoint.
```

**Test suite**:
- `ContentSubmissionServiceTest` (unit, Mockito): `submit_validAudioContent_savesWithDraftStatus`, `submit_invalidContentType_throwsValidationException`, `submit_delegatesToCorrectValidatorStrategy`
- `ContentControllerTest` (`@WebMvcTest`): `postContent_validPayload_returns201`, `postContent_missingTitle_returns400`, `postContent_unauthenticated_returns401`
- `ContentRepositoryTest` (`@DataJpaTest`): `save_persistsWithDraftStatusByDefault`

---

## Feature 2 — Voice Typing (Native-Language Transcript Submission)

**User story**: As an elder, I want to submit a voice-typed transcript as a written story.

**Entities/DTOs**: Reuses `Content` with `contentType = TEXT`; add `transcriptText` (TEXT column) to the `Content` entity.

**SOLID/OOP design**:
- The `TextValidator` strategy from Feature 1 handles this — no new service needed, demonstrating the Open/Closed benefit of the strategy pattern chosen above.
- Speech-to-text itself happens client-side (per your architecture decision) — the backend only receives final text, keeping this endpoint identical in shape to Feature 1's, just routed through a different validator.

**Implementation prompt**:
```
Extend ContentUploadRequestDto to optionally include transcriptText (required
when contentType is TEXT, ignored otherwise). Implement TextValidator
(implements ContentTypeValidator) to enforce a minimum transcript length and
reject empty/whitespace-only submissions. No new controller or service is
needed — this flows through the existing POST /api/v1/content endpoint from
Feature 1.
```

**Test suite**:
- `TextValidatorTest` (unit): `validate_emptyTranscript_fails`, `validate_belowMinimumLength_fails`, `validate_validTranscript_passes`
- `ContentControllerTest` (extend existing class): `postContent_textTypeWithoutTranscript_returns400`

---

## Feature 3 — Content Review & Draft Management

**User story**: As an elder, I want to edit a draft, add tags, and submit it for admin review, or discard it.

**Entities/DTOs**:
- Add `tags` (comma-separated TEXT column for MVP, per earlier normalization note) to `Content`
- `ContentUpdateRequestDto` (title, tags, transcriptText)
- `ContentStatusTransitionException` (custom exception)

**SOLID/OOP design**:
- Introduce a `ContentStateMachine` class encapsulating valid status transitions (`DRAFT → PENDING_REVIEW`, `NEEDS_CHANGES → PENDING_REVIEW`, `DRAFT → deleted`) as a single source of truth — Single Responsibility, and prevents transition logic from leaking into the controller or scattering across services.
- `ContentReviewService` depends on `ContentStateMachine` via interface, not by hardcoding enum checks — makes future status additions (e.g. an `ARCHIVED` state) a one-class change.

**Implementation prompt**:
```
Implement ContentReviewService with methods updateDraft(contentId, userId,
ContentUpdateRequestDto) and submitForReview(contentId, userId). Both methods
must verify the requesting userId owns the content (throw
AccessDeniedException otherwise) and use ContentStateMachine.canTransition(
currentStatus, targetStatus) before persisting a status change — if the
transition is invalid, throw ContentStatusTransitionException. Add
PATCH /api/v1/content/{id} and POST /api/v1/content/{id}/submit endpoints
to ContentController.
```

**Test suite**:
- `ContentStateMachineTest` (unit): `canTransition_draftToPendingReview_true`, `canTransition_publishedToDraft_false`, `canTransition_needsChangesToPendingReview_true`
- `ContentReviewServiceTest` (unit, Mockito): `updateDraft_nonOwner_throwsAccessDenied`, `submitForReview_fromDraft_succeeds`, `submitForReview_fromPublished_throwsTransitionException`
- `ContentControllerTest`: `patchContent_ownerEditsDraft_returns200`, `postSubmit_nonOwner_returns403`

---

## Feature 4 — My Stories (List, Search, Filter by Status)

**User story**: As an elder, I want to see all my stories, search them, and filter by status (All/Draft/Published).

**Entities/DTOs**: `ContentSummaryDto` (id, title, thumbnailUrl, status, createdAt, viewCount)

**SOLID/OOP design**:
- `ContentQueryService` interface, separate from `ContentSubmissionService` and `ContentReviewService` — Interface Segregation: a caller that only needs to *read* content shouldn't depend on an interface that also exposes write/submit methods.
- Use Spring Data JPA's `Specification` API for composable filtering (status + search term) rather than multiple ad-hoc repository methods — keeps the repository interface small and open to new filter combinations without new methods (Open/Closed).

**Implementation prompt**:
```
Implement ContentQueryService.getMyStories(userId, statusFilter, searchTerm,
Pageable): Page<ContentSummaryDto>, using a JPA Specification that
conditionally adds a status predicate and a case-insensitive title LIKE
predicate. Add GET /api/v1/content/mine?status=&search=&page= to
ContentController, returning paginated results.
```

**Test suite**:
- `ContentQueryServiceTest` (unit + `@DataJpaTest` for the specification logic): `getMyStories_noFilters_returnsAllOwnedByUser`, `getMyStories_statusFilter_returnsOnlyMatching`, `getMyStories_searchTerm_matchesCaseInsensitive`, `getMyStories_excludesOtherUsersContent`
- `ContentControllerTest`: `getMine_returnsPagedResponse`, `getMine_invalidStatusParam_returns400`

---

## Feature 5 — View Count Tracking

**User story**: As an elder, I want to see how many times my stories have been viewed, without inflating the count myself.

**Entities/DTOs**: `ContentView` entity (`id`, `contentId` FK, `viewerId` nullable FK, `viewedAt`) — used for debouncing, not just a raw counter column.

**SOLID/OOP design**:
- `ViewTrackingService` interface with a single method `recordView(contentId, viewerId)` — Single Responsibility, decoupled entirely from `ContentQueryService`.
- Debounce logic (one increment per viewer per content per day) lives inside this service, not in the controller, so the rule can change without touching any HTTP layer code.
- The owner-exclusion rule ("don't count the elder's own views") is enforced here by comparing `viewerId` to the content's `knowledgeHolderId` — a guard clause, not scattered conditionals elsewhere.

**Implementation prompt**:
```
Implement ViewTrackingService.recordView(contentId, viewerId). Skip recording
(no-op) if viewerId equals the content owner's user id. Otherwise, check
ContentViewRepository for an existing ContentView row for this
(contentId, viewerId) within the last 24 hours using a custom query method;
if none exists, insert one and increment Content.viewCount atomically
(use @Modifying with a native UPDATE ... SET view_count = view_count + 1 to
avoid lost updates under concurrent requests). Add
POST /api/v1/content/{id}/view, called by the frontend when a story is opened.
```

**Test suite**:
- `ViewTrackingServiceTest` (unit, Mockito): `recordView_ownerViewsOwnContent_doesNotIncrement`, `recordView_newViewerWithin24h_incrementsOnce`, `recordView_sameViewerTwiceWithin24h_incrementsOnlyOnce`, `recordView_sameViewerAfter24h_incrementsAgain`
- `ContentViewRepositoryTest` (`@DataJpaTest`): `existsRecentView_findsWithin24Hours`, `existsRecentView_excludesOlderThan24Hours`
- Concurrency note: add an integration test firing concurrent `recordView` calls for the same content and asserting the final count matches the number of unique viewers, catching lost-update bugs the unit tests can't.

---

## Feature 6 — Knowledge Holder Trust Score & Level

**User story**: As an elder, I want my Knowledge Keeper level to rise as I contribute more.

**Entities/DTOs**: Add `trustScore` (already in `knowledge_holder_profiles` from earlier schema) and a derived `level` (computed, not stored, to avoid drift). `TrustScoreDetailDto` (level, storiesShared, nextMilestoneStoriesNeeded).

**SOLID/OOP design**:
- `TrustScoreCalculator` as its own class with a single method `calculate(int storiesShared, int totalViews): TrustScoreResult` — pure function, easily unit-tested without touching the database, and swappable if the scoring formula changes (Open/Closed — new formula = new class implementing the same interface).
- `TrustScoreService` orchestrates: fetches counts via repository, delegates the actual math to `TrustScoreCalculator`, never contains the formula itself — Single Responsibility split between "get the numbers" and "do the math."

**Implementation prompt**:
```
Define a TrustScoreCalculator interface with calculate(storiesShared, totalViews):
TrustScoreResult (level, currentScore, storiesToNextLevel). Implement a
StoryCountBasedCalculator as the initial strategy (level thresholds at 3, 6, 9,
12 stories, matching the wireframe's milestone list). Implement
TrustScoreService.getDetail(userId): TrustScoreDetailDto, which counts
published content via ContentRepository, delegates to the injected
TrustScoreCalculator, and returns the result. Add
GET /api/v1/knowledge-holders/me/trust-score.
```

**Test suite**:
- `StoryCountBasedCalculatorTest` (unit, no Spring context needed): `calculate_zeroStories_returnsLevel0`, `calculate_exactlyAtThreshold_advancesLevel`, `calculate_belowNextThreshold_returnsCorrectRemainingCount`
- `TrustScoreServiceTest` (unit, Mockito): `getDetail_countsOnlyPublishedContent_excludesDraftsAndPending`
- `TrustScoreControllerTest`: `getTrustScore_returns200WithExpectedShape`

---

## Feature 7 — Review & Rating

**User story**: As an elder, I want a visible rating and readable reviews reflecting feedback from creators/community I've worked with — not just a number.

**Entities/DTOs**: `ElderRating` entity (`id`, `elderId` FK, `ratedByUserId` FK, `score` 1–5, `comment` nullable, `createdAt`). Add denormalized `averageRating` and `ratingCount` to `knowledge_holder_profiles` for fast summary reads. `ReviewResponseDto` (reviewerName, reviewerAvatarUrl, score, comment, createdAt) for the individual-reviews list.

**SOLID/OOP design**:
- `RatingService` interface separate from `TrustScoreService` — these are two distinct metrics per the scope decision above, so keeping them in separate classes prevents one from silently absorbing the other's responsibility later.
- Split responsibilities within `RatingService` itself: `submitRating(...)` (write path) vs. a separate `ReviewQueryService` for `getReviews(elderId, Pageable)` (read path) — Interface Segregation, since the profile screen only ever needs the read side, and shouldn't depend on an interface that also exposes write methods.
- Recalculating the denormalized average happens inside `RatingService.submitRating(...)`, using a repository aggregate query — the controller never touches the average field directly (encapsulation).

**Implementation prompt**:
```
Implement RatingService.submitRating(elderId, ratedByUserId, score, comment):
persists an ElderRating row, then recalculates and updates
knowledge_holder_profiles.average_rating and rating_count using a repository
AVG()/COUNT() query scoped to elderId. Reject self-rating (ratedByUserId ==
elderId) with a validation exception. Separately, implement
ReviewQueryService.getReviews(elderId, Pageable): Page<ReviewResponseDto>,
joining ElderRating with the reviewer's basic profile info (name, avatar) for
display — this is what powers a scrollable "reviews" list on the elder's
profile, not just the single average number.

Add POST /api/v1/knowledge-holders/{id}/ratings,
GET /api/v1/knowledge-holders/{id}/ratings/summary (average + count), and
GET /api/v1/knowledge-holders/{id}/reviews (paginated individual reviews).
```

**Test suite**:
- `RatingServiceTest` (unit, Mockito): `submitRating_validRating_updatesAverageAndCount`, `submitRating_selfRating_throwsValidationException`, `submitRating_firstRatingEver_averageEqualsScore`
- `RatingRepositoryTest` (`@DataJpaTest`): `calculateAverage_multipleRatings_returnsCorrectMean`, `calculateAverage_noRatings_returnsNullOrZero`
- `ReviewQueryServiceTest` (unit + `@DataJpaTest`): `getReviews_returnsReviewerNameAndAvatar_notJustScore`, `getReviews_ordersByMostRecentFirst`, `getReviews_paginatesCorrectly`

---

## Feature 8 — Hire-a-Creator Job Request Submission (Admin-Gated)

**User story**: As an elder, I want to describe what I need recorded (by voice or text) and send it for admin review before it's published to creators.

**Entities/DTOs**:
- `JobRequest` entity: `id`, `elderId` FK, `title`, `description`, `inputMode` (enum: `VOICE`, `TEXT`), `status` (enum: `DRAFT`, `PENDING_ADMIN_REVIEW`, `PUBLISHED`, `REJECTED`, `CLOSED`), `adminNotes` (nullable), `createdAt`
- `JobRequestSubmissionDto`

**SOLID/OOP design**:
- Reuse the `ContentStateMachine` *pattern* (not the same class) — implement a separate `JobRequestStateMachine`, since job request transitions differ (they include an admin-gated state that content review doesn't have). Two small, focused state machines beat one large one trying to serve both — Single Responsibility.
- `JobRequestService` depends on an `AdminNotificationPort` interface (Dependency Inversion) to notify the admin module a request is awaiting review, without the elder module knowing anything about how the Admin/Archive module is implemented — this is the actual module boundary between Member A and Member C's code, and it should stay an interface, never a direct class dependency across modules.

**Implementation prompt**:
```
Implement JobRequestService.submit(elderId, JobRequestSubmissionDto): creates
a JobRequest with status PENDING_ADMIN_REVIEW (skipping DRAFT if the elder
submits directly, or allow an explicit saveDraft() method for DRAFT first).
On successful submission, call an injected AdminNotificationPort.notify(
jobRequestId) — implement a simple AdminNotificationPortImpl for now that just
inserts a row into an admin task queue table; the Archive/Admin module owns
the actual queue consumer. Add POST /api/v1/job-requests and
POST /api/v1/job-requests/{id}/submit.
```

**Test suite**:
- `JobRequestStateMachineTest` (unit): `canTransition_draftToPendingAdminReview_true`, `canTransition_pendingToPublished_onlyViaAdminAction` (documents that this module cannot self-publish)
- `JobRequestServiceTest` (unit, Mockito): `submit_validRequest_setsStatusPendingReview`, `submit_callsAdminNotificationPort`, `submit_emptyDescriptionAndNoVoiceInput_throwsValidationException`
- `JobRequestControllerTest`: `postJobRequest_validPayload_returns201`

---

## Feature 9 — My Hire Requests (List & Status Tracking)

**User story**: As an elder, I want to see all my hire requests and their current status (including "waiting for admin review").

**Entities/DTOs**: `JobRequestSummaryDto` (id, title, status, applicantCount, createdAt)

**SOLID/OOP design**:
- `JobRequestQueryService`, separate from `JobRequestService` (submission) — same Interface Segregation reasoning as Feature 4.

**Implementation prompt**:
```
Implement JobRequestQueryService.getMyRequests(elderId, statusFilter):
List<JobRequestSummaryDto>, joining JobRequest with a count of related
JobApplication rows. Add GET /api/v1/job-requests/mine?status=.
```

**Test suite**:
- `JobRequestQueryServiceTest` (unit + `@DataJpaTest`): `getMyRequests_includesApplicantCount`, `getMyRequests_statusFilter_returnsOnlyMatching`, `getMyRequests_excludesOtherEldersRequests`

---

## Feature 10 — Applicant Review (Approve/Reject Creators)

**User story**: As an elder, I want to see creators who applied to my job request and approve or reject each one.

**Entities/DTOs**: `JobApplication` entity: `id`, `jobRequestId` FK, `creatorId` FK, `message`, `status` (enum: `PENDING`, `ACCEPTED`, `REJECTED`), `rejectionReason` (nullable — optional, elder is never required to provide one), `appliedAt`. `JobApplicationSummaryDto` (creator name, rating, message, status).

**SOLID/OOP design**:
- `JobApplicationReviewService.approve(...)` / `.reject(...)` — approving one application should, in the same transaction, reject all other pending applications for that job request (business rule: one creator per job). Encapsulate this rule inside the service method, not left to the caller to orchestrate — prevents an inconsistent state if a controller forgets a step.
- `reject(jobRequestId, applicationId, elderId, reason)` treats `reason` as an optional parameter (nullable `String`) — no separate "reject with reason" vs. "reject without reason" method overload needed, since a null/blank reason is a perfectly valid input, not a different code path. Keeps the method signature single and simple rather than multiplying overloads for something that isn't really a variation point.
- On approval, this service calls an injected `MessagingChannelPort` interface (Dependency Inversion again) to open a conversation thread — since messaging is owned by the Marketplace/Creator module per your note, this module only depends on the *interface*, never the concrete chat implementation.

**Implementation prompt**:
```
Implement JobApplicationReviewService.approve(jobRequestId, applicationId,
elderId) and .reject(jobRequestId, applicationId, elderId, reason) where
reason is a nullable String. Both verify the elderId owns the parent
JobRequest (AccessDeniedException otherwise). approve() must, within a single
@Transactional method: set the target application to ACCEPTED, set all other
PENDING applications for the same jobRequestId to REJECTED (with
rejectionReason left null for these auto-rejected ones, since the elder didn't
personally reject them), set the JobRequest status to CLOSED, and call
MessagingChannelPort.openConversation(elderId, creatorId) — implement a stub
MessagingChannelPortImpl that logs the call for now, to be replaced by the
actual integration once the Marketplace module's messaging API is available.
reject() simply sets the target application to REJECTED and stores the
provided reason as-is (including null/blank — do not enforce a minimum length
or require the field). Add GET /api/v1/job-requests/{id}/applications,
POST /api/v1/job-requests/{id}/applications/{appId}/approve, and
POST .../reject with an optional { "reason": string } request body.
```

**Test suite**:
- `JobApplicationReviewServiceTest` (unit, Mockito): `approve_setsTargetAccepted`, `approve_rejectsAllOtherPendingApplications`, `approve_closesParentJobRequest`, `approve_callsMessagingChannelPort`, `approve_nonOwnerElder_throwsAccessDenied`, `reject_withReason_storesReasonText`, `reject_withoutReason_succeedsWithNullReason`, `reject_singleApplication_doesNotAffectOthers`
- `JobApplicationControllerTest`: `getApplications_returnsSummaryList`, `postApprove_alreadyClosedJob_returns409`, `postReject_emptyRequestBody_returns200` (confirms the reason field is genuinely optional at the HTTP layer, not just in the service)

---

## Feature 11 — Reply-with-Voice on Requests

**User story**: As an elder, I want to respond to an incoming question or applicant message using a voice recording.

**Entities/DTOs**: No new entity — this reuses the `MessagingChannelPort` from Feature 10 (send a message where the payload happens to be a media URL rather than text).

**SOLID/OOP design**:
- Because the message content type (text vs. voice-note URL) varies, define a `MessageContent` value object (or a small sealed-style enum + payload pair) rather than overloading the port method with multiple parameters — keeps `MessagingChannelPort.sendMessage(conversationId, MessageContent)` stable regardless of how many content types are added later (Open/Closed).

**Implementation prompt**:
```
Extend MessagingChannelPort with sendMessage(conversationId, MessageContent),
where MessageContent has a type (TEXT or VOICE_NOTE) and a value (text string
or media URL). Implement a ReplyService.replyWithVoice(conversationId, userId,
mediaUrl) that constructs a MessageContent(VOICE_NOTE, mediaUrl) and calls the
port. Add POST /api/v1/conversations/{id}/reply-voice — this is a thin
adapter endpoint; the actual conversation storage lives in the Marketplace
module.
```

**Test suite**:
- `ReplyServiceTest` (unit, Mockito): `replyWithVoice_buildsCorrectMessageContent`, `replyWithVoice_callsPortWithVoiceNoteType`
- Contract test note: since this crosses a module boundary, add a `MessagingChannelPortContractTest` that the Marketplace team's real implementation must also pass, verifying it accepts a `MessageContent` of type `VOICE_NOTE` without error — this catches integration mismatches at build time instead of during the Sprint demo.

---

## Feature 12 — Earnings & Payout *(descoped — frontend decoration only)*

Confirmed with the team: for now, the earnings balance and withdraw button are **static UI elements**, not backed by real data or logic. No entity, service, controller, or test suite for this in the current sprint — skip straight to Feature 13.

If this becomes a real feature later, revisit the credit-vs-real-currency question flagged earlier before designing the `WalletTransaction` ledger.

---

## Feature 13 — Voice-Guided Tutorial State

**User story**: As an elder, I want the app to know whether I've completed the voice tutorial, so it doesn't repeat unnecessarily, but I can replay it anytime.

**Entities/DTOs**: Add `tutorialCompleted` (boolean) to `users` (simple flag — no dedicated entity needed, avoiding over-engineering a feature this small).

**SOLID/OOP design**:
- Deliberately **not** over-designed: a single boolean and two endpoints is proportionate to the feature's actual complexity. This is worth stating explicitly in your report — SOLID doesn't mean "add interfaces everywhere," it means match the abstraction to genuine variation points, and this feature has none yet.

**Implementation prompt**:
```
Add tutorialCompleted (boolean, default false) to the User entity. Implement
UserProfileService.markTutorialComplete(userId) and add
PATCH /api/v1/users/me/tutorial-complete. The "replay tutorial" action needs
no backend call at all — it's a pure frontend action that re-plays the same
static tutorial content already bundled in the app.
```

**Test suite**:
- `UserProfileServiceTest` (unit, Mockito): `markTutorialComplete_setsFlagTrue`, `markTutorialComplete_idempotentOnRepeatedCalls`
- `UserControllerTest`: `patchTutorialComplete_returns200`

---

## Cross-cutting notes for the whole module

- **Ownership checks** (verifying `userId` owns the resource being modified) appear in Features 3, 8, and 10 — extract this into a shared `OwnershipGuard` utility or a custom `@PreAuthorize` SpEL expression rather than copy-pasting the same `if` check across each. This is the DRY complement to the SOLID principles above.
- **Module boundary discipline**: Features 8, 10, and 11 all cross into Member C's (Admin) or Member B's (Marketplace) territory. Every one of those crossings is deliberately expressed as an interface (`AdminNotificationPort`, `MessagingChannelPort`) that this module owns the contract for for but does not implement the other side of — agree on these interface signatures with Members B and C **before** either side starts coding, or integration in Sprint 3 will be painful.
- **Test coverage shape**: every feature above follows the same pattern — pure-logic unit tests (calculators, state machines) that need no Spring context and run in milliseconds, service-layer unit tests with mocked repositories/ports, and a thin layer of `@WebMvcTest`/`@DataJpaTest` slice tests. Avoid defaulting to full `@SpringBootTest` integration tests for everything — they're slow and this module doesn't need them except for the one concurrency test flagged in Feature 5.
