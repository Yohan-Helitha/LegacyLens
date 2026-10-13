package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.messaging.integration.HiringMessagingChannelAdapter;
import lk.ac.sliit.legacylens.messaging.service.MessagingService;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Runs the hiring team's shared MessagingChannelPort contract against the real
 * implementation (the messaging module's adapter), plus checks that each call
 * reaches the shared MessagingService as the right user.
 */
class HiringMessagingChannelAdapterContractTest extends MessagingChannelPortContractTest {

    private static final UUID SIGNED_IN_USER = UUID.randomUUID();

    private final MessagingService messagingService = mock(MessagingService.class);

    @BeforeEach
    void signIn() {
        when(messagingService.openConversation(any(), any(), any())).thenAnswer(invocation -> UUID.randomUUID());

        User user = new User();
        user.setId(SIGNED_IN_USER);
        CustomUserDetails details = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(details, null, List.of()));
    }

    @AfterEach
    void signOut() {
        SecurityContextHolder.clearContext();
    }

    @Override
    protected MessagingChannelPort getPort() {
        return new HiringMessagingChannelAdapter(messagingService);
    }

    @Test
    void voiceNoteWithSender_isStoredAsThatSender() {
        UUID conversationId = UUID.randomUUID();
        UUID elderId = UUID.randomUUID();

        getPort().sendMessage(conversationId, elderId, new MessageContent(MessageContentType.VOICE_NOTE, "/uploads/v.m4a"));

        verify(messagingService).sendVoiceNote(elderId, conversationId, "/uploads/v.m4a");
    }

    @Test
    void textWithoutSender_isStoredAsTheSignedInUser() {
        UUID conversationId = UUID.randomUUID();

        getPort().sendMessage(conversationId, new MessageContent(MessageContentType.TEXT, "Hello"));

        verify(messagingService).sendText(SIGNED_IN_USER, conversationId, "Hello");
    }

    @Test
    void openConversation_opensTheSharedConversationWithNoOpportunity() {
        UUID elderId = UUID.randomUUID();
        UUID creatorId = UUID.randomUUID();

        getPort().openConversation(elderId, creatorId);

        verify(messagingService).openConversation(elderId, creatorId, null);
    }
}
