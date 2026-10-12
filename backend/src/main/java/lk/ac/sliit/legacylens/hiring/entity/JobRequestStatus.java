package lk.ac.sliit.legacylens.hiring.entity;

/**
 * Lifecycle of an elder's hire-a-creator request. Stored as a VARCHAR in
 * `job_requests.status`. See JobRequestStateMachine for legal transitions —
 * this module only ever drives DRAFT -> PENDING_ADMIN_REVIEW and (via
 * JobApplicationReviewService) PUBLISHED -> CLOSED; PENDING_ADMIN_REVIEW ->
 * PUBLISHED/REJECTED are admin actions from a module not yet built.
 */
public enum JobRequestStatus {
    DRAFT,
    PENDING_ADMIN_REVIEW,
    PUBLISHED,
    REJECTED,
    CLOSED
}
