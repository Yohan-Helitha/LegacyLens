package lk.ac.sliit.legacylens.stories.entity;

/**
 * Lifecycle of a story. Every story starts PENDING; nothing in this backend
 * flips it to PUBLISHED yet — that's a future moderation/publishing step,
 * out of scope for the capture workflow itself.
 * Stored as a VARCHAR in the `stories.status` column.
 */
public enum StoryStatus {
    PENDING,
    PUBLISHED
}
