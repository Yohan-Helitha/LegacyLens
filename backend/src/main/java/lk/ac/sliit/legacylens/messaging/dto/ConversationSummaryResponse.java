package lk.ac.sliit.legacylens.messaging.dto;

import lk.ac.sliit.legacylens.messaging.entity.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** One row in the inbox (InApp screen). */
@Data
@Builder
@AllArgsConstructor
public class ConversationSummaryResponse {

    private UUID id;
    private ParticipantResponse otherParticipant;

    /** Null when the conversation isn't tied to an opportunity. */
    private ConversationContextResponse context;

    /** Null until the first message is sent. */
    private String lastMessagePreview;
    private MessageType lastMessageType;
    private boolean lastMessageFromMe;
    private LocalDateTime lastMessageAt;

    private long unreadCount;
}
