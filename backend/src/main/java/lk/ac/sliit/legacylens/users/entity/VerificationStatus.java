package lk.ac.sliit.legacylens.users.entity;

/**
 * Verification lifecycle for creator profiles.
 * Stored as a VARCHAR in the `creator_profiles.verification_status` column.
 */
public enum VerificationStatus {
    PENDING,
    VERIFIED,
    REJECTED
}
