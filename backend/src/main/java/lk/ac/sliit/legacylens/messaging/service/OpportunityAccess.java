package lk.ac.sliit.legacylens.messaging.service;

import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;

import java.util.Optional;
import java.util.UUID;

/**
 * What messaging needs to know about opportunities. Messaging depends on this
 * interface; the marketplace-backed implementation lives in
 * {@code messaging.integration}, so the service never touches marketplace
 * repositories directly.
 */
public interface OpportunityAccess {

    Optional<Opportunity> findOpportunity(UUID opportunityId);

    /** A creator is connected to an opportunity once they have applied, been invited or booked it. */
    boolean isCreatorConnected(UUID opportunityId, UUID creatorId);
}
