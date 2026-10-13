package lk.ac.sliit.legacylens.marketplace.event;

import java.util.UUID;

/** A creator sent an application for one of a knowledge holder's opportunities. */
public record ApplicationSubmittedEvent(UUID elderId, UUID applicationId, String opportunityTitle, String creatorName) {
}
