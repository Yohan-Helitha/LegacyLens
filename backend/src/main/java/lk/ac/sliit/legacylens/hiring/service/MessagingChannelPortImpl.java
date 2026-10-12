package lk.ac.sliit.legacylens.hiring.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Stub implementation, to be replaced once the Marketplace module's real
 * messaging API is available. Logs the call and returns a fresh id so
 * callers on this side have something to reference — no actual conversation
 * storage happens here.
 */
@Service
public class MessagingChannelPortImpl implements MessagingChannelPort {

    private static final Logger log = LoggerFactory.getLogger(MessagingChannelPortImpl.class);

    @Override
    public UUID openConversation(UUID elderId, UUID creatorId) {
        UUID conversationId = UUID.randomUUID();
        log.info("[stub] openConversation elderId={} creatorId={} -> conversationId={}", elderId, creatorId, conversationId);
        return conversationId;
    }

    @Override
    public void sendMessage(UUID conversationId, MessageContent content) {
        log.info("[stub] sendMessage conversationId={} type={} value={}", conversationId, content.getType(), content.getValue());
    }
}
