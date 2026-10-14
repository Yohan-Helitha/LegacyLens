package lk.ac.sliit.legacylens.marketplace.entity;

/**
 * Lifecycle of an elder's invitation to a recommended creator (see
 * OpportunityCreatorInvitation). Stored as a VARCHAR.
 *
 * Only INVITED is produced today — a creator-facing screen to accept or
 * decline invitations hasn't been built yet. ACCEPTED/DECLINED are defined up
 * front so that screen won't need a schema change.
 */
public enum CreatorInvitationStatus {
    INVITED,
    ACCEPTED,
    DECLINED
}
