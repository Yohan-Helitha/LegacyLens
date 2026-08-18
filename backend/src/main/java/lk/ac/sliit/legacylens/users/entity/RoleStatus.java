package lk.ac.sliit.legacylens.users.entity;

/**
 * Whether a user's role assignment is currently active.
 * Stored as a VARCHAR in the `user_roles.status` column.
 */
public enum RoleStatus {
    ACTIVE,
    INACTIVE
}
