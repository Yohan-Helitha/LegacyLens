package lk.ac.sliit.legacylens.stories.entity;

/**
 * Lifecycle of a story. Every story starts PENDING; nothing in this backend
 * flips it to PUBLISHED yet — that's a future moderation/publishing step,
 * out of scope for the capture workflow itself.
 *
 * DRAFT exists so "My Stories" can filter by it (see StoryQueryService) — no
 * code path sets a story to DRAFT yet; that's the still-out-of-scope
 * draft/submit-for-review workflow. Its presence here is purely additive and
 * doesn't change PENDING/PUBLISHED behavior.
 *
 * Stored as a VARCHAR in the `stories.status` column.
 */
public enum StoryStatus {
    DRAFT,
    PENDING,
    PUBLISHED
}
