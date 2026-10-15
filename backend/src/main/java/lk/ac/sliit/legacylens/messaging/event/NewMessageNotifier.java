package lk.ac.sliit.legacylens.messaging.event;

import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

/**
 * Tells someone, on their phone, that a message just arrived for them - the way a chat app does when it is
 * closed. It runs only after the message has been saved, and a failure here is only logged: the message is
 * already sent and the other person will still see it when they open the chat.
 */
@Component
public class NewMessageNotifier {

    private static final Logger log = LoggerFactory.getLogger(NewMessageNotifier.class);

    private final PushNotificationService pushNotificationService;

    public NewMessageNotifier(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onMessageSent(MessageSentEvent event) {
        try {
            pushNotificationService.sendToUser(event.recipientId(), messageFor(event));
        } catch (RuntimeException e) {
            log.warn("Could not notify {} about a new message in conversation {}",
                    event.recipientId(), event.conversationId(), e);
        }
    }

    /** The sender's name as the title, the message (or "Voice message") as the text; tapping opens that chat. */
    static PushMessage messageFor(MessageSentEvent event) {
        String sender = event.senderName() == null || event.senderName().isBlank() ? "New message" : event.senderName();
        return new PushMessage(sender, event.preview(),
                Map.of("type", "new-message", "conversationId", event.conversationId().toString()));
    }
}
