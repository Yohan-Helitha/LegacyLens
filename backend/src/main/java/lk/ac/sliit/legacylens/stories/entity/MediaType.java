package lk.ac.sliit.legacylens.stories.entity;

/**
 * Kind of the attached media clip, inferred from its content type when
 * stored. Null on a story with no clip (e.g. a future WRITTEN story).
 * Stored as a VARCHAR in the `stories.media_type` column.
 */
public enum MediaType {
    AUDIO,
    VIDEO
}
