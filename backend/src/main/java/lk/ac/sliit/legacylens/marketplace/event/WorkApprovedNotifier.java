package lk.ac.sliit.legacylens.marketplace.event;

import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

/** Tells a creator, on their phone, that their work was approved or published. A failure here is only logged. */
@Component
public class WorkApprovedNotifier {

    private static final Logger log = LoggerFactory.getLogger(WorkApprovedNotifier.class);

    private final PushNotificationService pushNotificationService;

    public WorkApprovedNotifier(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onApproved(WorkApprovedEvent event) {
        try {
            pushNotificationService.sendToUser(event.creatorId(), messageFor(event));
        } catch (RuntimeException e) {
            log.warn("Could not notify creator {} about approved work {}", event.creatorId(), event.jobId(), e);
        }
    }

    static PushMessage messageFor(WorkApprovedEvent event) {
        if (event.published()) {
            return new PushMessage("Published", "Your content \"" + event.jobTitle() + "\" is now published.",
                    Map.of("type", "work-approved", "jobId", event.jobId().toString()));
        }
        return new PushMessage("Content approved",
                "Your content \"" + event.jobTitle() + "\" was approved by the knowledge holder and the admin.",
                Map.of("type", "work-approved", "jobId", event.jobId().toString()));
    }
}
