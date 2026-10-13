package lk.ac.sliit.legacylens.marketplace.event;

import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

/**
 * Tells a knowledge holder, on their phone, that their opportunity has been published. It runs only
 * after the publish has been saved, and a failure here is only logged - the publish always stands.
 */
@Component
public class OpportunityPublishedNotifier {

    private static final Logger log = LoggerFactory.getLogger(OpportunityPublishedNotifier.class);

    private final PushNotificationService pushNotificationService;

    public OpportunityPublishedNotifier(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onPublished(OpportunityPublishedEvent event) {
        try {
            pushNotificationService.sendToUser(event.elderId(), messageFor(event));
        } catch (RuntimeException e) {
            log.warn("Could not notify knowledge holder {} about published opportunity {}", event.elderId(), event.opportunityId(), e);
        }
    }

    static PushMessage messageFor(OpportunityPublishedEvent event) {
        return new PushMessage(
                "Published",
                "\"" + event.opportunityTitle() + "\" is now published for content creators.",
                Map.of("type", "opportunity-published", "opportunityId", event.opportunityId().toString()));
    }
}
