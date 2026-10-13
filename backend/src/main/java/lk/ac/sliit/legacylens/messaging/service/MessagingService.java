package lk.ac.sliit.legacylens.messaging.service;

import lk.ac.sliit.legacylens.messaging.dto.ConversationDetailResponse;
import lk.ac.sliit.legacylens.messaging.dto.ConversationSummaryResponse;
import lk.ac.sliit.legacylens.messaging.dto.MessageResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Shared in-app messaging between elders and content creators — the one
 * place conversations and messages live, used by both sides of the app.
 *
 * Every method that takes a {@code userId} acts as that user and only ever
 * touches conversations they are part of; anything else is reported as
 * "not found" so conversation ids cannot be probed.
 *
 * Other modules (marketplace bookings, creator recommendations, the hiring
 * module via MessagingChannelPort) open conversations through the narrower
 * {@link ConversationOpener} and never touch the repositories directly.
 */
public interface MessagingService extends ConversationOpener {

    List<ConversationSummaryResponse> listConversations(UUID userId, ConversationFilter filter, String search);

    ConversationDetailResponse getConversation(UUID userId, UUID conversationId);

    /**
     * Messages in reading order. With {@code after}: only newer messages (polling).
     * With {@code before}: the page of older history before that time.
     * With neither: the latest page.
     */
    List<MessageResponse> getMessages(UUID userId, UUID conversationId, LocalDateTime before, LocalDateTime after, int limit);

    MessageResponse sendText(UUID userId, UUID conversationId, String text);

    MessageResponse sendVoiceNote(UUID userId, UUID conversationId, String mediaUrl);

    /** The user has seen everything in this chat up to now. */
    void markRead(UUID userId, UUID conversationId);

    /**
     * Opens (or returns) the caller's chat about an opportunity — only when the
     * two are actually connected through it (the creator applied, was invited
     * or booked it).
     */
    ConversationDetailResponse openForOpportunity(UUID userId, UUID opportunityId, UUID participantId);

}
