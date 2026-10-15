package lk.ac.sliit.legacylens.marketplace.service;

import java.util.UUID;

/**
 * Puts approved creator work in front of the app's users. Marketplace only knows this port; the adapter that
 * writes it into the user feed lives in the moderation module (which owns the feed's stories), so marketplace
 * never touches those repositories directly.
 */
public interface CreatorWorkPublisher {

    /** Publishes the work and returns the id of what was created in the feed. */
    UUID publish(PublishedWork work);
}
