package lk.ac.sliit.legacylens.messaging.event;

import java.util.UUID;

/** A message was sent in a conversation; {@code recipientId} is the other person, who should hear about it. */
public record MessageSentEvent(
        UUID recipientId,
        UUID conversationId,
        String senderName,
        String preview) {
}
