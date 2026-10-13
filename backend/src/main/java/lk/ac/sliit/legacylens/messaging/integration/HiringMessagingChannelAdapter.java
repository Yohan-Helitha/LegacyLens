package lk.ac.sliit.legacylens.messaging.integration;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.exception.ForbiddenOperationException;
import lk.ac.sliit.legacylens.hiring.service.MessageContent;
import lk.ac.sliit.legacylens.hiring.service.MessagingChannelPort;
import lk.ac.sliit.legacylens.messaging.service.MessagingService;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * The real implementation of the hiring module's MessagingChannelPort, backed
 * by the shared messaging module — so the elder-side hiring flow ("approve a
 * creator" opens a chat, "reply with voice" posts a voice note) lands in the
 * same conversations the creator sees in their inbox, with no change to the
 * hiring code beyond calling the port.
 *
 * {@code @Primary} so Spring injects this instead of hiring's logging stub
 * (MessagingChannelPortImpl), which stays in place for its own contract test.
 */
@Service
@Primary
public class HiringMessagingChannelAdapter implements MessagingChannelPort {

    private final MessagingService messagingService;

    public HiringMessagingChannelAdapter(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    @Override
    public UUID openConversation(UUID elderId, UUID creatorId) {
        return messagingService.openConversation(elderId, creatorId, null);
    }

    @Override
    public void sendMessage(UUID conversationId, UUID senderId, MessageContent content) {
        switch (content.getType()) {
            case TEXT -> messagingService.sendText(senderId, conversationId, content.getValue());
            case VOICE_NOTE -> messagingService.sendVoiceNote(senderId, conversationId, content.getValue());
        }
    }

    /**
     * The original port method carries no sender, so it's taken from the
     * signed-in user making this request — every current caller runs inside
     * an authenticated request. Prefer the three-argument overload.
     */
    @Override
    public void sendMessage(UUID conversationId, MessageContent content) {
        sendMessage(conversationId, currentUserId(), content);
    }

    private static UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails details) {
            return details.getUser().getId();
        }
        throw new ForbiddenOperationException("Sending a message requires a signed-in user.");
    }
}
