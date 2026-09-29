package lk.ac.sliit.legacylens.hiring.service;

import java.util.UUID;

/**
 * Replying to a conversation with a voice note. Deliberately simple: no
 * storage concerns here (the controller, a genuinely thin adapter, resolves
 * the uploaded file to a URL before calling this) — this class only builds
 * the right MessageContent and hands it to the port.
 */
public interface ReplyService {

    /**
     * userId isn't used to look anything up here — this module doesn't own
     * conversation membership (Marketplace does), so it can't verify the
     * caller belongs to conversationId. It's accepted for parity with a
     * future authorization check once that ownership data is reachable.
     */
    void replyWithVoice(UUID conversationId, UUID userId, String mediaUrl);
}
