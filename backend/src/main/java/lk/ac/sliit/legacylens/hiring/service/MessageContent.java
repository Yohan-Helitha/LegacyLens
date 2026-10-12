package lk.ac.sliit.legacylens.hiring.service;

import java.util.Objects;

/**
 * A message's content, whatever kind it is — a (type, value) pair rather
 * than overloading MessagingChannelPort.sendMessage with more parameters,
 * so a third content type later is a new MessageContentType value, not a
 * new method signature (Open/Closed).
 */
public final class MessageContent {

    private final MessageContentType type;
    /** Text string for TEXT, media URL for VOICE_NOTE. */
    private final String value;

    public MessageContent(MessageContentType type, String value) {
        this.type = Objects.requireNonNull(type, "type must not be null");
        this.value = Objects.requireNonNull(value, "value must not be null");
    }

    public MessageContentType getType() {
        return type;
    }

    public String getValue() {
        return value;
    }
}
