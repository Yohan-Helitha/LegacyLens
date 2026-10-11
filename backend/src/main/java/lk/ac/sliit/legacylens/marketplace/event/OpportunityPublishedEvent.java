package lk.ac.sliit.legacylens.marketplace.event;

import java.util.UUID;

/** An opportunity went live for content creators - the knowledge holder it belongs to is told. */
public record OpportunityPublishedEvent(UUID elderId, UUID opportunityId, String opportunityTitle) {
}
