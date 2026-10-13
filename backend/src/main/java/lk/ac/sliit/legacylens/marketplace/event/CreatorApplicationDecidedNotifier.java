package lk.ac.sliit.legacylens.marketplace.event;

import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

/** Tells an applicant, on their phone, how their creator application went. A failure here is only logged. */
@Component
public class CreatorApplicationDecidedNotifier {

    private static final Logger log = LoggerFactory.getLogger(CreatorApplicationDecidedNotifier.class);

    private final PushNotificationService pushNotificationService;

    public CreatorApplicationDecidedNotifier(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onDecided(CreatorApplicationDecidedEvent event) {
        try {
            pushNotificationService.sendToUser(event.userId(), messageFor(event));
        } catch (RuntimeException e) {
            log.warn("Could not notify {} about their creator application", event.userId(), e);
        }
    }

    static PushMessage messageFor(CreatorApplicationDecidedEvent event) {
        if (event.approved()) {
            return new PushMessage(
                    "You are now a content creator",
                    "Your application was approved. Log in again to open your creator space.",
                    Map.of("type", "creator-application-approved"));
        }
        String reason = event.note() == null || event.note().isBlank() ? "" : " Reason: " + event.note().trim();
        return new PushMessage(
                "Creator application not approved",
                "Your application was not approved." + reason + " You can update it and apply again.",
                Map.of("type", "creator-application-rejected"));
    }
}
