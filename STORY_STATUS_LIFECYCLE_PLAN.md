# Legacy Lens — Story Status Lifecycle Implementation Plan

> Status: **draft, revised after merging `dev-v2` into `fix/stories-status`**. The first version of this doc assumed no admin moderation system existed yet — that was wrong; it exists on `dev-v2` and is now merged in. This revision reflects the actual merged code, not assumptions. Still blocked on a design discussion with the Admin component owner (Lakni) before building anything — see "Real conflict to resolve" below, which is sharper now than the original open questions were.

## Why this doc exists

While debugging why some stories didn't show up in the mobile app, rows in the `stories` table turned out to have `status = 'REJECTED'` or `'ARCHIVED'` — values the elder-side `StoryStatus` enum (`backend/.../stories/entity/StoryStatus.java`) doesn't define. Hibernate throws `IllegalArgumentException: No enum constant ...StoryStatus.REJECTED` when it hits one of these rows, which fails the *entire* story list for whichever user owns that row.

The original theory was that these were manually-inserted test rows. **That was wrong.** After merging `dev-v2` (109 commits, including Lakni's admin dashboard work) into this branch, it's now clear those rows were written by an already-built, already-working admin moderation feature — `ModerationQueueServiceImpl` — being tested against the same shared Supabase database. The bug isn't bad data; it's that the elder-side `Story` entity and the admin-side `ModerationQueueItem` entity disagree about what a valid status is.

---

## The real conflict (verified by reading the actual merged code)

Two separate JPA entities both map onto the **same physical `stories` table**, with two **different, incompatible** status enums:

| | Elder side | Admin side |
|---|---|---|
| Entity | `Story` (`stories/entity/Story.java`) | `ModerationQueueItem` (`moderation/entity/ModerationQueueItem.java:16-19`, `@Table(name = "stories")`) |
| Status enum | `StoryStatus`: `DRAFT, PENDING, PUBLISHED` | `ModerationStatus`: `PENDING, PUBLISHED, REJECTED, ARCHIVED` |
| Enum→column mapping | Plain `@Enumerated(EnumType.STRING)` — **throws on unrecognized values** | `ModerationStatusConverter` (`moderation/converter/ModerationStatusConverter.java`), `@Converter(autoApply = true)` — **falls back to `PENDING` on unrecognized values instead of throwing** |
| Transition rules enforced | None yet (no submit/approve/reject/publish/archive endpoints exist) | **None at all** — `ModerationQueueServiceImpl.updateItemStatus` (`moderation/service/ModerationQueueServiceImpl.java:70-102`) accepts any of the 4 `ModerationStatus` values from any prior status, with no legality check |
| Endpoint | `GET/POST/PATCH/DELETE /api/stories/**` (`stories/controller/StoryController.java`) | `PATCH /api/admin/moderation/queue/{id}/status` (`moderation/controller/ModerationQueueController.java:36`) |

Three concrete, already-verified facts that change the plan:

1. **There is no DB-level constraint stopping this.** `ModerationSchemaInitializer` (`moderation/config/ModerationSchemaInitializer.java:52-70`) actively *drops* any CHECK constraint on `stories.status` at startup. The column is a free `VARCHAR(20)` — nothing stops either side from writing a value the other side can't read.
2. **The admin side's "unrecognized value" fallback is probably dead code.** `ModerationQueueItem.status` carries *both* `@Enumerated(EnumType.STRING)` *and* relies on `ModerationStatusConverter`'s `@Converter(autoApply = true)`. Per the JPA spec, an explicit `@Enumerated` on a field suppresses auto-apply converters for that field — so `ModerationStatusConverter.convertToEntityAttribute`'s graceful `PENDING` fallback almost certainly never runs; `@Enumerated` wins and Hibernate uses its default enum mapping instead. This has stayed invisible so far only because `ModerationStatus` already covers every value currently written. **Worth flagging to Lakni** — it's a latent version of the exact same bug, waiting for a 5th status value to expose it.
3. **The stopgap below avoids that trap** — `StoryStatusConverter` (elder side) does *not* keep `@Enumerated` on `Story.status`, specifically so the converter actually takes effect instead of silently being ignored the way the admin side's appears to be.

---

## Gap vs. what you described

Your described lifecycle was: `DRAFT → PENDING → (APPROVED | REJECTED)`, then `APPROVED → PUBLISHED`, then `PUBLISHED → ARCHIVED` (only reachable from `PUBLISHED`).

The **actually-built** admin flow (`ModerationQueueServiceImpl.updateItemStatus`) is flatter: `PENDING → (PUBLISHED | REJECTED)` directly, and separately `PUBLISHED → ARCHIVED` — but with **no enforcement** that archive can only happen from `PUBLISHED` (any status can be set to any status right now). There is **no `APPROVED` state anywhere in the merged code** — approving and publishing are the same action today.

**Update — question 1 resolved.** Confirmed against the live admin console (`localhost:4200/moderation`, Moderation Queue screen) and directly by the admin owner: the real action is **"Approve & Publish Live"** — one button, one action. There is no separate `APPROVED` holding state anywhere, by design, not by omission. So the real vocabulary is exactly 5 states: `DRAFT, PENDING, PUBLISHED, REJECTED, ARCHIVED` — `StoryStatus`'s 3 plus `ModerationStatus`'s 4, overlapping on everything except `DRAFT` (elder-only; drafts are never submitted, so admin never sees one).

Remaining open questions for Lakni:

1. ~~Does `APPROVED` get added as a real intermediate state~~ — **resolved, no.** Approve == Publish.
2. **Should transition legality be enforced at all**, given `updateItemStatus` currently allows any status → any status? Lower priority than originally framed — not required to fix the current bug, worth doing as separate hardening later (see "Optional hardening" below).
3. **Can a `REJECTED` story be edited and resubmitted?** Still unanswered — nothing in `ModerationQueueServiceImpl` addresses re-submission at all.
4. **Naming**: the mobile app has its own speculative `NEEDS_CHANGES` status (`mobile-app/src/types/story.ts:12`) never backed by any backend value. Recommend aligning it to `REJECTED` to match what the admin side actually writes.

---

## Recommended minimal-change design

Given question 1 is resolved, the fix isn't "reconcile two different lifecycles" — it's "stop having two enums that happen to describe the same states by convention." Minimal, mechanical, no API/DB contract change:

1. **`StoryStatus`** (stays canonical — lives in `stories`, the more foundational domain; `moderation` is admin tooling layered on top of it, not the other way round) gains `REJECTED`, `ARCHIVED`. 2 lines.
2. **`ModerationQueueItem.status`** field type changes from `ModerationStatus` → `lk.ac.sliit.legacylens.stories.entity.StoryStatus`; drop its `@Enumerated(EnumType.STRING)` (the same annotation already silently breaking `ModerationStatusConverter`'s own fallback — this fixes that too, incidentally).
3. **Delete** `moderation/entity/ModerationStatus.java` and `moderation/converter/ModerationStatusConverter.java` — redundant once `ModerationQueueItem.status` is typed `StoryStatus`, since `StoryStatusConverter` is already `@Converter(autoApply = true)` and picks up *any* field of that type automatically, no per-field `@Convert` needed.
4. **Mechanical call-site updates** (~2 files): `ModerationQueueServiceImpl.java` — `ModerationStatus.valueOf(...)` → `StoryStatus.valueOf(...)` (the `switch (newStatus) { case PUBLISHED -> ... }` block is unchanged, case labels just resolve against the new type); `ModerationQueueRepository.java` — `findByStatus(ModerationStatus status)` → `findByStatus(StoryStatus status)`.

No DB migration (string values are identical either way), no change to the Angular console's API contract (same JSON strings, same endpoints, same buttons). Total footprint: 2 files deleted, 1 field-type edit, a handful of call-site line edits — small enough for Lakni to review as a single easy PR, and it's the actual fix rather than another stopgap.

### Optional hardening (not required to fix the current problem — do later if wanted)

- `StoryStateMachine` (same pattern as `hiring/service/JobRequestStateMachine.java`) to enforce that `ARCHIVED` is only reachable from `PUBLISHED`, etc. — `updateItemStatus` currently allows any transition. Worth doing eventually, not blocking.
- Elder-facing `submit`/`archive` endpoints so `DRAFT` and elder-triggered `ARCHIVED` actually become reachable (today every story is created straight at `PENDING` — `DRAFT` is unused in practice, confirmed by `StoryServiceImpl`'s create defaulting directly to `PENDING`). Worth confirming with product whether a real "save draft, submit later" flow is even wanted, or whether immediate-submit-on-save (current behavior) is fine as-is.

### Future-proofing note (not building now, per your "future configuration" flags)

`ModerationQueueItem` already has `imageUrl`/`tags` columns ready for the thumbnail-on-approve and AI-auto-tag-on-approve features you flagged. The elder-facing `StoryResponse` DTO (`stories/dto/StoryResponse.java`) doesn't expose either field yet — nothing to do now, just don't forget to add them there when that work starts, or elders won't be able to see what gets set.

---

## Immediate low-risk fix — **done** (doesn't require resolving anything above)

Implemented: `backend/src/main/java/lk/ac/sliit/legacylens/stories/converter/StoryStatusConverter.java`, and removed `@Enumerated(EnumType.STRING)` from `Story.status` (`stories/entity/Story.java`) so the converter actually takes effect (see point 2/3 above — keeping `@Enumerated` would have silently disabled it, the same trap the admin side may already be in).

Verified: `mvn compile` passes; `mvn test` still shows 2 pre-existing failures (`StoryRepositoryIntegrationTest.authorIsRequired`, `StorySpecificationsIntegrationTest.getMyStories_statusFilter_returnsOnlyMatching`) — confirmed via `git stash` to reproduce identically **without** this change too, so they're not a regression from the converter. They're further evidence of the `Story`/`ModerationQueueItem` dual-mapping problem: H2's schema auto-generation gets confused when two different `@Entity` classes both target `@Table(name = "stories")` with different column/constraint metadata (one test shows `author_id`'s `NOT NULL` silently not enforced, the other shows a stray CHECK constraint violation on insert). Worth mentioning to Lakni alongside the enum question — this is a second symptom of the same one-table-two-entities root cause, not a separate bug.

Original rationale, unchanged — the elder-side crash can be fixed today the same way the admin side (nominally) fixed it for itself — add a converter instead of relying on bare `@Enumerated(EnumType.STRING)`:

```java
// stories/converter/StoryStatusConverter.java — mirrors
// moderation/converter/ModerationStatusConverter.java exactly
@Converter(autoApply = true)
public class StoryStatusConverter implements AttributeConverter<StoryStatus, String> {
    public String convertToDatabaseColumn(StoryStatus attribute) {
        return attribute != null ? attribute.name() : StoryStatus.PENDING.name();
    }
    public StoryStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return StoryStatus.PENDING;
        try { return StoryStatus.valueOf(dbData.trim().toUpperCase()); }
        catch (IllegalArgumentException e) { return StoryStatus.PENDING; }
    }
}
```

Effect: any story sitting at `REJECTED`/`ARCHIVED`/anything-not-yet-defined shows up in the elder's "My Stories" as `PENDING` instead of crashing the whole list. It's a safe stopgap, not a real fix — those stories will *display* as still-under-review even though they've actually been rejected/archived/published-and-archived, so it shouldn't be treated as done, just as "stops erroring while we sort out the real design." Worth doing now since it's ~15 lines, touches nothing else, and directly fixes today's actual symptom.

---

## Implementation breakdown

Superseded by "Recommended minimal-change design" above for the enum/entity question — kept here only for the parts still relevant (elder-facing endpoints, mobile UI). Do the minimal-change design first; everything below builds on top of it, once agreed with Lakni.

### Feature C — Elder-facing endpoints: submit / publish / archive

- `POST /api/stories/{id}/submit` — `DRAFT → PENDING`.
- `POST /api/stories/{id}/archive` — `PUBLISHED → ARCHIVED`. (No elder-facing "publish" endpoint — publishing only ever happens via admin approval, confirmed above.)
- Ownership check (`author.id == callerId`, 404 otherwise), same shape as `StoryController`'s existing methods. `publishedAt` should be set by whatever path sets `status = PUBLISHED` — today that's only `ModerationQueueServiceImpl.updateItemStatus`, which already does this (`ModerationQueueServiceImpl.java:100-102`); `Story.publishedAt` (`Story.java:81-82`) is a separate, still-unused column on the elder-side entity, so once the entities share a status type, decide whether `Story.publishedAt` should also get set (e.g. via a shared trigger/listener) or whether it's redundant now that the admin side already tracks it.

### Feature D — Mobile: status-aware UI

- `mobile-app/src/types/story.ts:12` — align `StoryStatus` union to `'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED'` (drop the speculative `NEEDS_CHANGES`).
- `StatusPill.tsx` — add an `ARCHIVED` pill variant; rename the `NEEDS_CHANGES` variant to `REJECTED`.
- `story_review.tsx` — status-conditional actions: `DRAFT` → "Submit for Review"; `PUBLISHED` → "Archive"; show `rejectionReason`/`rejectionNotes` when `REJECTED` (need exposing through `StoryResponse` — see future-proofing note above, same gap applies here).

### Feature E — Verify existing data once the minimal-change design lands

No migration needed for the rows already sitting at `REJECTED`/`ARCHIVED` — once `Story`/`ModerationQueueItem` share `StoryStatus`, they'll read correctly on both sides with no data changes.
