package lk.ac.sliit.legacylens.marketplace.event;

import java.util.UUID;

/** A knowledge holder or the admin sent a creator's submission back with changes to make. */
public record WorkFeedbackGivenEvent(UUID creatorId, UUID jobId, String jobTitle, String from) {
}
