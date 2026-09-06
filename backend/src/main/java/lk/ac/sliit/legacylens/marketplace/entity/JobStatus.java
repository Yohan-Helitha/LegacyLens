package lk.ac.sliit.legacylens.marketplace.entity;

/**
 * Lifecycle of a job a creator has taken on for an elder.
 * Stored as a VARCHAR in the `jobs.status` column.
 *
 * Payment itself happens off-platform (cash, handed over in person once the
 * work is done) and isn't modeled here yet — that arrives with the future
 * "work progress" feature (creator marks FINISHED, collects payment, uploads
 * a signed receipt as proof, then marks PAID). Until then, COMPLETED is the
 * terminal state and CreatorDashboard treats every completed job's amount as
 * still-outstanding balance.
 */
public enum JobStatus {
    UPCOMING,
    ACTIVE,
    COMPLETED,
    CANCELLED
}
