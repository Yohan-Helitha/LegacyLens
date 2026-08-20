package lk.ac.sliit.legacylens.users.entity;

/**
 * Possible states of a user account.
 * Stored as a VARCHAR in the `users.account_status` column.
 */
public enum AccountStatus {
    ACTIVE,
    SUSPENDED,
    DEACTIVATED
}
