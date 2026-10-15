package lk.ac.sliit.legacylens.marketplace.event;

import java.util.UUID;

/** An admin approved or rejected someone's "Become a Content Creator" application. */
public record CreatorApplicationDecidedEvent(UUID userId, boolean approved, String note) {
}
