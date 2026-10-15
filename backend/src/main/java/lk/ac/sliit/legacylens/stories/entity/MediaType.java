package lk.ac.sliit.legacylens.stories.entity;

/**
 * Kind of the attached media clip, inferred from its content type when
 * stored. Null on a story with no clip (e.g. a future WRITTEN story).
 * Stored as a VARCHAR in the `stories.media_type` column.
 */
public enum MediaType {
    AUDIO,
    VIDEO,
    /**
     * Not a clip: written content stored with type BLOG by the admin / content side (the column is shared). Listed so
     * such rows load and round-trip; to a storyteller this is simply a written story.
     */
    BLOG;

    /** True for a playable audio/video clip; false for BLOG. */
    public boolean isClip() {
        return this == AUDIO || this == VIDEO;
    }
}
