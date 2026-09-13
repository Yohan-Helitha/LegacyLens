package lk.ac.sliit.legacylens.marketplace.entity;

/**
 * Lifecycle of an opportunity listing. Only PUBLISHED opportunities are ever
 * returned to content creators (see OpportunityRepository / OpportunityService).
 * DRAFT exists for the future admin review step — an admin can save partial
 * work while still transcribing an elder's audio submission before publishing it.
 */
public enum OpportunityStatus {
    DRAFT,
    PUBLISHED,
    CLOSED
}
