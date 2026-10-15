package lk.ac.sliit.legacylens.marketplace.entity;

/**
 * Lifecycle of a creator's application to a single Opportunity.
 * Stored as a VARCHAR in the `opportunity_applications.status` column.
 *
 * PENDING -> APPROVED and PENDING -> REJECTED are the knowledge holder's
 * decision (see ElderApplicationReviewController). APPROVED -> BOOKED happens
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
