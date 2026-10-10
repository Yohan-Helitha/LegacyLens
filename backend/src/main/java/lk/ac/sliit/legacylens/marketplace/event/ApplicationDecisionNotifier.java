package lk.ac.sliit.legacylens.marketplace.event;

import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;
import java.util.Optional;

/**
 * Tells a creator, on their phone, how their application went. It runs only after the decision has
 * been saved, and a failure here is only logged - the decision always stands.
 */
@Component
public class ApplicationDecisionNotifier {

    private static final Logger log = LoggerFactory.getLogger(ApplicationDecisionNotifier.class);

    private final PushNotificationService pushNotificationService;

    public ApplicationDecisionNotifier(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onDecision(ApplicationDecidedEvent event) {
        Optional<PushMessage> message = messageFor(event);
        if (message.isEmpty()) {
            return;
        }
        try {
            pushNotificationService.sendToUser(event.creatorId(), message.get());
        } catch (RuntimeException e) {
            log.warn("Could not notify creator {} about application {}", event.creatorId(), event.applicationId(), e);
        }
    }

    static Optional<PushMessage> messageFor(ApplicationDecidedEvent event) {
        String title = event.opportunityTitle();
        Map<String, String> data = Map.of(
                "applicationId", event.applicationId().toString(),
                "decision", event.decision().name());

        if (event.decision() == OpportunityApplicationStatus.REJECTED) {
            return Optional.of(new PushMessage(
                    "Application update",
                    "\"" + title + "\" was not accepted this time. You can apply to other opportunities.",
                    withType(data, "application-rejected")));
        }
        if (event.decision() == OpportunityApplicationStatus.APPROVED) {
            return Optional.of(new PushMessage(
                    "Application accepted",
                    "Good news - \"" + title + "\" was accepted. Confirm your booking.",
                    withType(data, "application-approved")));
        }
        return Optional.empty();
    }

    private static Map<String, String> withType(Map<String, String> data, String type) {
        Map<String, String> result = new java.util.HashMap<>(data);
        result.put("type", type);
        return result;
    }
}
