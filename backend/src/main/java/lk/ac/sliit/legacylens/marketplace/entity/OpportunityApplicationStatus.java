package lk.ac.sliit.legacylens.marketplace.entity;

/**
 * Lifecycle of a creator's application to a single Opportunity.
 * Stored as a VARCHAR in the `opportunity_applications.status` column.
 *
 * A knowledge holder/admin review UI for these applications hasn't been
 * built yet (same gap as Opportunity/Job themselves), so PENDING -> APPROVED
 * and PENDING -> REJECTED are currently triggered by the creator themselves
 * via TEMPORARY self-approve/self-reject endpoints (see
 * OpportunityApplicationController#approve / #reject) — replace both with a
 * real elder-facing review flow once it exists. APPROVED -> BOOKED happens
 * when the creator taps "Book" on an approved application from the
 * dashboard's Upcoming Booking tab.
 */
public enum OpportunityApplicationStatus {
    SAVED,
    PENDING,
    APPROVED,
    REJECTED,
    BOOKED
}
