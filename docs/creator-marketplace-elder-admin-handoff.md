# Creator marketplace: what the elder side and the admin side must build

Written for the elder-side and admin-side developers. The creator side and **all the backend endpoints below
already exist and are tested**. What is missing is the **screens** (mobile app for the elder, admin dashboard for
the admin) that call them. Nothing here needs a new backend table or endpoint from you unless it says so.

## The whole flow, and who owns each step

| # | Step | Who acts | Backend (done) | Screen to build |
|---|------|----------|----------------|-----------------|
| 1 | A user applies to become a content creator | Creator app | `POST /api/creator-applications` | done (creator app) |
| 2 | **Admin approves or rejects that application** | **Admin** | `/api/admin/creator-applications` | **admin dashboard** |
| 3 | Admin creates an opportunity | **Admin** | `POST /api/admin/opportunities` | done (admin dashboard) |
| 4 | Creator applies to an opportunity | Creator app | `/api/opportunity-applications` | done (creator app) |
| 5 | **Elder approves or declines the application** | **Elder** | `/api/elder/opportunity-applications` | **elder app** |
| 6 | Creator books it, does the work, submits it | Creator app | `/api/jobs/{id}/work-progress/...` | done (creator app) |
| 7 | **Elder reads the submission, approves or asks for changes** | **Elder** | `/api/elder/work-review` + `/api/elder/work-feedback` | **elder app** |
| 8 | **Admin reads the submission, approves or asks for changes** | **Admin** | `/api/admin/work-review` + `/api/admin/work-feedback` | **admin dashboard** |
| 9 | Both approved: the job becomes Completed | automatic | - | - |
| 10 | **Admin publishes the completed work** | **Admin** | `POST /api/admin/work-feedback/jobs/{id}/publish` | **admin dashboard** |
| 11 | **Elder rates the creator** | **Elder** | `/api/elder/creator-rating/jobs/{id}` | **elder app** |

All `/api/admin/**` endpoints need a logged-in account with the ADMIN role. All `/api/elder/**` endpoints use the
signed-in user as the elder: an elder only ever sees their **own** opportunities and jobs, anyone else's is "not found".
Every response is wrapped as `{ success, message, data }`.

---

## ADMIN SIDE

### A. Creator applications ("Become a Content Creator") - new

Until now nothing turned an application into a creator. These endpoints do it.

| Call | What it does |
|------|--------------|
| `GET /api/admin/creator-applications?status=ALL\|PENDING\|VERIFIED\|REJECTED` | The queue, newest first. Default `ALL`. |
| `GET /api/admin/creator-applications/{id}` | One application in full. |
| `POST /api/admin/creator-applications/{id}/approve?note=...` | Approves. |
| `POST /api/admin/creator-applications/{id}/reject?reason=...` | Rejects. **Always send a reason**: the applicant sees it. |

Send the headers `X-Admin-Id` and `X-Admin-Name` on approve and reject, the same as the user-verification screen,
so the decision is written to the audit log.

Each application contains: `id, userId, fullName, phoneNumber, additionalPhoneNumbers[], city, nicNumber, email,
aboutYou, skills, interests, languages[], experienceLevel, experienceDescription, proofDocumentUrl, status,
submittedAt, reviewNote, reviewedAt`.

- `proofDocumentUrl` is a relative `/uploads/...` path. Show it so the admin can open the proof document.
- **Approve** sets the application to `VERIFIED`, gives the user the `YOUTH_CREATOR` role, creates (or verifies) their
  creator profile, and sends them a phone notification. They do not need to be touched anywhere else.
- **Reject** sets it to `REJECTED`, stores your reason, and notifies them. They can edit and apply again; a new
  submission starts a fresh `PENDING` review and clears the old reason.
- Only a `PENDING` application can be decided. Deciding twice returns an error.
- Screen to build: a list with a PENDING / VERIFIED / REJECTED filter, a detail view with the proof document, and
  Approve / Reject buttons (reject needs a reason box).

### B. Submitted work review - new read endpoints

Before this, an admin could send feedback but could not see what the creator had submitted.

| Call | What it does |
|------|--------------|
| `GET /api/admin/work-review` | Every submitted piece of work, newest first (summary lines). |
| `GET /api/admin/work-review/jobs/{jobId}` | The full submission to read. |

A summary line: `jobId, title, creatorId, creatorName, elderName, category, submittedAt, state, elderApproved,
adminApproved, publishedAt`. `state` is one of:
`AWAITING_REVIEW` (waiting on reviewers), `CHANGES_REQUESTED` (sent back, the creator is editing),
`COMPLETED` (both approved), `PUBLISHED`.

The detail adds: `brief` (what the opportunity asked for), `introduction`, `story`, `seoSummary`, `seoKeywords[]`,
`materials[]` (`fileName`, `fileUrl`, `uploadedAt` - photos, videos, recordings), `elderFeedback`, `adminFeedback`.
Material `fileUrl` values are relative `/uploads/...` paths; prefix with the API host to display them. The admin
sees **both** reviewers' notes.

### C. Approve, ask for changes, publish - already existed

Use the review endpoints above to read the work, then:

| Call | Effect |
|------|--------|
| `POST /api/admin/work-feedback/jobs/{jobId}/approve` | The admin's approval. |
| `POST /api/admin/work-feedback/jobs/{jobId}` body `{ "message": "..." }` | Sends it back to the creator with a note. |
| `POST /api/admin/work-feedback/jobs/{jobId}/publish` | Publishes completed work. Only works once both have approved. |

When the elder **and** the admin have approved, the job becomes `COMPLETED` by itself and the creator is notified.
Asking for changes puts it on the creator's *Rejected Submissions* page and clears that reviewer's approval.
When the creator resubmits, **both** approvals are cleared and both reviewers must approve again.

### D. The admin notification bell - extended

`GET /api/admin/notifications` now also returns, besides opportunities and moderation items:

- `type: "creator-application"` - one per **pending** creator application (`id` = application id)
- `type: "work-submission"` - one per submission **waiting for the admin's approval** (`id` = job id)

These two types leave the list on their own once the item is decided, so `markAsRead` does nothing for them.
Link the first to the application detail screen and the second to the work-review detail.

### E. Still your job from the earlier hand-off

The Approve / Decline buttons and the two feedback columns (elder note, admin note) the admin dashboard shows come
from `/api/admin/work-feedback`. The admin never sees a creator's private fields beyond what the application
endpoint above returns.

---

## ELDER SIDE (mobile app)

### A. New applications on my opportunities

| Call | What it does |
|------|--------------|
| `GET /api/elder/opportunity-applications` | Every submitted application on **my** opportunities, newest first. |
| `POST /api/elder/opportunity-applications/{id}/approve` | Approves it. Only a `PENDING` one. |
| `POST /api/elder/opportunity-applications/{id}/reject` | Declines it. |

The mobile wrapper `elderApplicationReviewApi` already exists in
`mobile-app/src/services/api/opportunityApplicationApi.ts`, but **no screen uses it yet**.
Approving or declining notifies the creator on their phone. After a decline the creator **cannot** apply to that
opportunity again; after an approval they book a time and the job appears in their schedule.

### B. Review the work a creator submitted - new read endpoints

| Call | What it does |
|------|--------------|
| `GET /api/elder/work-review` | The work submitted on **my** jobs, newest first. |
| `GET /api/elder/work-review/jobs/{jobId}` | The full submission to read. |

The shapes are the same as the admin ones in section B above, with one difference: **`adminFeedback` is always null
for the elder**. The elder must never see the admin's note, and the admin's note is not part of the published work.

Then, as before:

| Call | Effect |
|------|--------|
| `POST /api/elder/work-feedback/jobs/{jobId}/approve` | The elder's approval. |
| `POST /api/elder/work-feedback/jobs/{jobId}` body `{ "message": "..." }` | Sends it back to the creator with a note. |
| `GET /api/elder/work-feedback/jobs/{jobId}` | The elder's own note and approval state. |

### C. Rate the creator

After the work is completed the elder rates the creator 1 to 5 stars with a comment:
`GET` / `POST /api/elder/creator-rating/jobs/{jobId}`. This feeds the creator's rating on their profile and
"Client Feedback" (average of all reviews, one review per job; rating again replaces the earlier one).

### D. Phone notifications the elder now receives

Registered through the same `push_devices` mechanism, so the elder's phone must be registered
(see the Firebase note below). Each carries `data.type`; use it to decide which screen a tap opens:

| `data.type` | When | Extra data | Open |
|-------------|------|------------|------|
| `application-received` | A creator submits an application on my opportunity | `applicationId` | application list |
| `work-submitted` | A creator submits work, or **resubmits** after changes | `jobId` | work-review detail |

The two titles for work are "Work ready to review" and "Updated work to review" (a resubmission).

---

## Things to know before you start

1. **Phone notifications need Firebase.** A device only receives pushes after it has registered a token, and on Android
   that needs `google-services.json` in the app plus a new development build. Until then the server quietly sends
   nothing. Check `SELECT user_id, platform FROM push_devices;` to see who is registered.
2. **Temporary test code stands in for you.** The creator app has "Approve (Test)" / "Decline (Test)" buttons on the
   creator-application status page, on a submitted job in My Work, and on applications. They call
   `/api/creator-applications/me/test/...`, `/api/jobs/{id}/work-progress/test/...` and the temporary approve/reject
   in `OpportunityApplicationController`. They go through the **same services** your screens will call, so behaviour is
   identical. Once your screens exist, delete: `TemporaryCreatorApplicationTestController`,
   `TemporaryReviewTestController`, `TemporaryReminderTestController`, the temporary approve/reject endpoints in
   `OpportunityApplicationController`, and the matching buttons in the creator app.
3. **`submittedAt` is the first submission time.** It is not updated on a resubmission, so sort the queue by it only as
   "oldest first"; use `state` to tell a fresh submission from one waiting after changes.
4. **A rejected creator application is not final.** The creator can fix it and resubmit, so expect the same person to
   reappear as `PENDING` with a new `submittedAt`.
5. **Run the backend tests** with `mvn test` from `backend/`. `CreatorApplicationReviewServiceImplTest` and
   `WorkReviewServiceImplTest` document the rules above.
