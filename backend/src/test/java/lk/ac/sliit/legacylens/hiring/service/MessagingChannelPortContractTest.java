package lk.ac.sliit.legacylens.hiring.service;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Any real MessagingChannelPort implementation — including the one the
 * Marketplace team eventually builds to replace MessagingChannelPortImpl —
 * must pass this same suite. Catches an integration mismatch (e.g. it
 * throws on an unrecognized content type) at build time instead of during
 * the Sprint demo. Subclass this and implement getPort() to run it against
 * a new implementation.
 */
abstract class MessagingChannelPortContractTest {

    protected abstract MessagingChannelPort getPort();

    @Test
    void openConversation_returnsNonNullConversationId() {
        UUID conversationId = getPort().openConversation(UUID.randomUUID(), UUID.randomUUID());

        org.assertj.core.api.Assertions.assertThat(conversationId).isNotNull();
    }

    @Test
    void sendMessage_acceptsTextContentWithoutError() {
        UUID conversationId = getPort().openConversation(UUID.randomUUID(), UUID.randomUUID());

        assertThatCode(() -> getPort().sendMessage(conversationId, new MessageContent(MessageContentType.TEXT, "Hello")))
                .doesNotThrowAnyException();
    }

    /** The specific case Feature 11 (Reply-with-Voice) depends on. */
    @Test
    void sendMessage_acceptsVoiceNoteContentWithoutError() {
        UUID conversationId = getPort().openConversation(UUID.randomUUID(), UUID.randomUUID());

        assertThatCode(() -> getPort().sendMessage(conversationId, new MessageContent(MessageContentType.VOICE_NOTE, "/uploads/voice-replies/clip.m4a")))
                .doesNotThrowAnyException();
    }
}
