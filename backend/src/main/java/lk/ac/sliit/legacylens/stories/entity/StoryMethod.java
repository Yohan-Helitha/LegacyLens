package lk.ac.sliit.legacylens.stories.entity;

/**
 * How a story's content was captured — matches the three options on the
 * mobile app's "Share your story" method-select screen.
 * Stored as a VARCHAR in the `stories.method` column.
 */
public enum StoryMethod {
    /** Recorded live in-app via the mic (voice or video). */
    RECORDED,
    /** An existing video picked from the device's media library. */
    UPLOADED,
    /** Typed directly — no media clip. Not built on the client yet. */
    WRITTEN
}
