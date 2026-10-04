package lk.ac.sliit.legacylens.messaging.service;

import java.util.UUID;

/**
 * The only thing other modules (marketplace bookings, creator recommendations,
 * the hiring module's messaging port) need from messaging: make sure a chat
 * exists between an elder and a creator. Kept apart from {@link MessagingService}
 * so those callers don't depend on reading, sending or inbox operations.
 */
public interface ConversationOpener {

    /**
     * Opens (or returns) the one conversation between this elder and creator,
     * pointing its context at {@code opportunityId} when given. No permission
     * checks - callers have already established the relationship.
     */
    UUID openConversation(UUID elderId, UUID creatorId, UUID opportunityId);
}
