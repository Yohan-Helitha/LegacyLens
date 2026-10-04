package lk.ac.sliit.legacylens.messaging.service;

import lk.ac.sliit.legacylens.messaging.entity.MessageType;

/** The one-line text shown for a message in the inbox list. */
final class MessagePreview {

    static final int LENGTH = 120;
    static final String VOICE_NOTE = "Voice message";

    private MessagePreview() {
    }

    static String of(MessageType type, String body) {
        return type == MessageType.VOICE_NOTE ? VOICE_NOTE : truncate(body);
    }

    static String truncate(String text) {
        String singleLine = text.replaceAll("\\s+", " ").trim();
        return singleLine.length() <= LENGTH ? singleLine : singleLine.substring(0, LENGTH - 1) + "\u2026";
    }
}
