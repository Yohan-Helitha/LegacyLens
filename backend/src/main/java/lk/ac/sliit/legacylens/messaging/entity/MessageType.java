package lk.ac.sliit.legacylens.messaging.entity;

/** What a message carries. Stored as a VARCHAR in `messages.type`. */
public enum MessageType {
    /** Plain text in Message.body. */
    TEXT,
    /** A recorded voice clip — its "/uploads/..." URL is in Message.mediaUrl. */
    VOICE_NOTE
}
