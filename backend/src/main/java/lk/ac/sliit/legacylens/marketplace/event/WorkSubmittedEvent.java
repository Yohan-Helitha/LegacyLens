package lk.ac.sliit.legacylens.marketplace.event;

import java.util.UUID;

/** A creator submitted finished work (or, after changes were asked for, submitted it again) for the knowledge holder to review. */
public record WorkSubmittedEvent(UUID elderId, UUID jobId, String jobTitle, String creatorName, boolean resubmission) {
}
