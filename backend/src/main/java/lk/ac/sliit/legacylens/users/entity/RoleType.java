package lk.ac.sliit.legacylens.users.entity;

/**
 * All possible roles a user can hold in LegacyLens.
 * Every new user starts as GENERAL_USER.
 * Stored as a VARCHAR in the `user_roles.role_type` column.
 */
public enum RoleType {
    /** Default role assigned at registration. */
    GENERAL_USER,
    /** Elder / knowledge-holder can record and share stories. */
    ELDER,
    /** Youth content creator can take on marketplace jobs. */
    YOUTH_CREATOR,
    /** Youth learner consumes archived content and lessons. */
    YOUTH_LEARNER,
    /** Platform administrator / moderator. */
    ADMIN
}
