package lk.ac.sliit.legacylens.marketplace.event;

import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

/** Tells a creator, on their phone, that changes were asked for. A failure here is only logged. */
@Component
public class WorkFeedbackNotifier {

    private static final Logger log = LoggerFactory.getLogger(WorkFeedbackNotifier.class);

    private final PushNotificationService pushNotificationService;

    public WorkFeedbackNotifier(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onFeedback(WorkFeedbackGivenEvent event) {
        try {
            pushNotificationService.sendToUser(event.creatorId(), messageFor(event));
        } catch (RuntimeException e) {
            log.warn("Could not notify creator {} about feedback on job {}", event.creatorId(), event.jobId(), e);
        }
    }

    static PushMessage messageFor(WorkFeedbackGivenEvent event) {
        return new PushMessage(
                "Changes requested",
                "The " + event.from() + " asked for changes to \"" + event.jobTitle() + "\". See Rejected Submissions.",
                Map.of("type", "work-feedback", "jobId", event.jobId().toString()));
    }
}
