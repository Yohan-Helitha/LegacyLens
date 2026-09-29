package lk.ac.sliit.legacylens.stories.entity;

/**
 * Lifecycle of a story — the single shared status vocabulary for the
 * `stories` table, used by both the elder-facing Story entity and the
 * admin-facing ModerationQueueItem entity (moderation package). They used to
 * carry two separate, independently-drifting enums (StoryStatus vs the old
 * ModerationStatus) that happened to overlap by convention; this is that
 * merged into one, since a story's status is one property of one row, not
 * two.
 *
 * Every story starts PENDING (elder creation doesn't currently route through
 * DRAFT — see "no code path sets DRAFT yet" below). The admin console
 * ("Approve & Publish Live" / "Reject" in the Moderation Queue) then moves a
 * PENDING story directly to PUBLISHED or REJECTED — there is no separate
 * "approved" holding state, by design. A PUBLISHED story can later be
 * ARCHIVED.
 *
 * DRAFT exists so "My Stories" can filter by it (see StoryQueryService) — no
 * code path sets a story to DRAFT yet; that's the still-out-of-scope
 * draft/submit-for-review workflow. Its presence here is purely additive and
 * doesn't change PENDING/PUBLISHED/REJECTED/ARCHIVED behavior. It's also
 * elder-only in practice: a draft is never submitted to the moderation
 * queue, so ModerationQueueItem never encounters this value.
 *
 * Stored as a VARCHAR in the `stories.status` column, mapped via
 * StoryStatusConverter (stories/converter) rather than @Enumerated — see
 * that converter's own doc comment for why that distinction matters here.
 */
public enum StoryStatus {
    DRAFT,
    PENDING,
    PUBLISHED,
    REJECTED,
    ARCHIVED
}
