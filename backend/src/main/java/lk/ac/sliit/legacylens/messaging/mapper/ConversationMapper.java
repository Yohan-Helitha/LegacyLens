package lk.ac.sliit.legacylens.messaging.mapper;

import lk.ac.sliit.legacylens.messaging.dto.ConversationDetailResponse;
import lk.ac.sliit.legacylens.messaging.dto.ConversationSummaryResponse;
import lk.ac.sliit.legacylens.messaging.dto.MessageResponse;
import lk.ac.sliit.legacylens.messaging.dto.ParticipantResponse;
import lk.ac.sliit.legacylens.messaging.entity.Conversation;
import lk.ac.sliit.legacylens.messaging.entity.Message;
import lk.ac.sliit.legacylens.messaging.service.ConversationContextProvider;
import lk.ac.sliit.legacylens.users.entity.User;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Turns conversations and messages into the responses each caller sees, from that caller's point of view. */
@Component
public class ConversationMapper {

    public static final String ROLE_ELDER = "ELDER";
    public static final String ROLE_CREATOR = "CREATOR";

    private final ConversationContextProvider contextProvider;

    public ConversationMapper(ConversationContextProvider contextProvider) {
        this.contextProvider = contextProvider;
    }

    public ConversationSummaryResponse toSummary(Conversation conversation, UUID userId, long unreadCount) {
        return ConversationSummaryResponse.builder()
                .id(conversation.getId())
                .otherParticipant(toParticipant(conversation, userId, false))
                .context(contextProvider.contextFor(conversation))
                .lastMessagePreview(conversation.getLastMessagePreview())
                .lastMessageType(conversation.getLastMessageType())
                .lastMessageFromMe(userId.equals(conversation.getLastMessageSenderId()))
                .lastMessageAt(conversation.getLastMessageAt())
                .unreadCount(unreadCount)
                .build();
    }

    public ConversationDetailResponse toDetail(Conversation conversation, UUID userId) {
        return ConversationDetailResponse.builder()
                .id(conversation.getId())
                .myRole(conversation.isElder(userId) ? ROLE_ELDER : ROLE_CREATOR)
                .otherParticipant(toParticipant(conversation, userId, true))
                .context(contextProvider.contextFor(conversation))
                .build();
    }

    public MessageResponse toMessage(Message message, UUID userId) {
        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSender().getId())
                .fromMe(message.getSender().getId().equals(userId))
                .type(message.getType())
                .body(message.getBody())
                .mediaUrl(message.getMediaUrl())
                .createdAt(message.getCreatedAt())
                .build();
    }

    /** The phone number is only included on the single-chat response, never in the inbox list. */
    private static ParticipantResponse toParticipant(Conversation conversation, UUID userId, boolean includePhone) {
        boolean otherIsElder = !conversation.isElder(userId);
        User other = conversation.otherParticipant(userId);
        return ParticipantResponse.builder()
                .userId(other.getId())
                .name(other.getFullName())
                .avatarUrl(other.getProfilePhotoUrl())
                .role(otherIsElder ? ROLE_ELDER : ROLE_CREATOR)
                .roleLabel(otherIsElder ? "Knowledge Holder" : "Content Creator")
                .phoneNumber(includePhone ? other.getPhoneNumber() : null)
                .build();
    }
}
