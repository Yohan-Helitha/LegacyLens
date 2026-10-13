package lk.ac.sliit.legacylens.messaging.dto;

import lk.ac.sliit.legacylens.messaging.entity.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class MessageResponse {

    private UUID id;
    private UUID conversationId;
    private UUID senderId;
    /** True when the caller sent it — the app aligns it to the right. */
    private boolean fromMe;
    private MessageType type;
    /** Text for TEXT messages; null for voice notes. */
    private String body;
    /** "/uploads/..." URL for VOICE_NOTE messages; null for text. */
    private String mediaUrl;
    private LocalDateTime createdAt;
}
