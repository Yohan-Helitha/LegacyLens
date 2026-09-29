package lk.ac.sliit.legacylens.hiring.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ReplyServiceImplTest {

    private static final UUID CONVERSATION_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();

    @Mock
    private MessagingChannelPort messagingChannelPort;

    private ReplyServiceImpl replyService;

    @BeforeEach
    void setUp() {
        replyService = new ReplyServiceImpl(messagingChannelPort);
    }

    @Test
    void replyWithVoice_buildsCorrectMessageContent() {
        replyService.replyWithVoice(CONVERSATION_ID, USER_ID, "/uploads/voice-replies/clip.m4a");

        ArgumentCaptor<MessageContent> captor = ArgumentCaptor.forClass(MessageContent.class);
        verify(messagingChannelPort).sendMessage(eq(CONVERSATION_ID), captor.capture());
        assertThat(captor.getValue().getValue()).isEqualTo("/uploads/voice-replies/clip.m4a");
    }

    @Test
    void replyWithVoice_callsPortWithVoiceNoteType() {
        replyService.replyWithVoice(CONVERSATION_ID, USER_ID, "/uploads/voice-replies/clip.m4a");

        ArgumentCaptor<MessageContent> captor = ArgumentCaptor.forClass(MessageContent.class);
        verify(messagingChannelPort).sendMessage(eq(CONVERSATION_ID), captor.capture());
        assertThat(captor.getValue().getType()).isEqualTo(MessageContentType.VOICE_NOTE);
    }
}
