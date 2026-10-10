package lk.ac.sliit.legacylens.marketplace.event;

import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;

import java.util.UUID;

/** A knowledge holder (or, for now, the temporary test buttons) approved or rejected a creator's application. */
public record ApplicationDecidedEvent(
        UUID creatorId,
        UUID applicationId,
        String opportunityTitle,
        OpportunityApplicationStatus decision) {
}
