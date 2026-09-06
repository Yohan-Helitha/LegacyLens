package lk.ac.sliit.legacylens.marketplace.entity;

/**
 * Lifecycle of a creator's application to a single Opportunity.
 * Stored as a VARCHAR in the `opportunity_applications.status` column.
 *
 * APPROVED exists here to match the eventual full flow, but nothing sets it
 * yet — a knowledge holder/admin review UI for these applications hasn't
 * been built (same gap as Opportunity/Job themselves), so today every
 * application only ever moves SAVED -> PENDING.
 */
public enum OpportunityApplicationStatus {
    SAVED,
    PENDING,
    APPROVED
}
