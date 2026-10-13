package lk.ac.sliit.legacylens.marketplace.event;

import java.util.UUID;

/** A creator's submitted work was approved by both reviewers (published = false) or then published (true). */
public record WorkApprovedEvent(UUID creatorId, UUID jobId, String jobTitle, boolean published) {
}
