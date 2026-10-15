package lk.ac.sliit.legacylens.messaging.event;

import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class NewMessageNotifierTest {

    private final PushNotificationService push = mock(PushNotificationService.class);
    private final NewMessageNotifier notifier = new NewMessageNotifier(push);

    @Test
    void theRecipientGetsTheSendersNameAndTheMessage_andTappingOpensThatChat() {
        UUID recipient = UUID.randomUUID();
        UUID conversation = UUID.randomUUID();

        notifier.onMessageSent(new MessageSentEvent(recipient, conversation, "Kamala Wijesinghe", "Saturday is fine"));

        ArgumentCaptor<PushMessage> sent = ArgumentCaptor.forClass(PushMessage.class);
        verify(push).sendToUser(org.mockito.ArgumentMatchers.eq(recipient), sent.capture());
        assertThat(sent.getValue().title()).isEqualTo("Kamala Wijesinghe");
        assertThat(sent.getValue().body()).isEqualTo("Saturday is fine");
        assertThat(sent.getValue().data()).containsEntry("type", "new-message")
                .containsEntry("conversationId", conversation.toString());
    }

    @Test
    void aNamelessSender_stillGivesAReadableTitle() {
        PushMessage message = NewMessageNotifier.messageFor(
                new MessageSentEvent(UUID.randomUUID(), UUID.randomUUID(), " ", "Hi"));

        assertThat(message.title()).isEqualTo("New message");
    }

    @Test
    void aFailureToNotify_isSwallowed_theMessageIsAlreadySent() {
        doThrow(new RuntimeException("push down")).when(push).sendToUser(any(), any());

        notifier.onMessageSent(new MessageSentEvent(UUID.randomUUID(), UUID.randomUUID(), "Nimal", "Hi"));
    }
}
