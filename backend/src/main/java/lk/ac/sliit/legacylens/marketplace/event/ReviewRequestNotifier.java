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
 * Tells a knowledge holder, on their phone, that a creator is waiting on them: a new application, or
 * finished work to review. A failure here is only logged - it can never undo the creator's submission.
 */
@Component
public class ReviewRequestNotifier {

    private static final Logger log = LoggerFactory.getLogger(ReviewRequestNotifier.class);

    private final PushNotificationService pushNotificationService;

    public ReviewRequestNotifier(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onApplication(ApplicationSubmittedEvent event) {
        send(event.elderId(), messageFor(event));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onWork(WorkSubmittedEvent event) {
        send(event.elderId(), messageFor(event));
    }

    private void send(java.util.UUID elderId, PushMessage message) {
        try {
            pushNotificationService.sendToUser(elderId, message);
        } catch (RuntimeException e) {
            log.warn("Could not notify knowledge holder {} about a review request", elderId, e);
        }
    }

    static PushMessage messageFor(ApplicationSubmittedEvent event) {
        return new PushMessage(
                "New application",
                event.creatorName() + " applied for \"" + event.opportunityTitle() + "\". Open it to approve or decline.",
                Map.of("type", "application-received", "applicationId", event.applicationId().toString()));
    }

    static PushMessage messageFor(WorkSubmittedEvent event) {
        String title = event.resubmission() ? "Updated work to review" : "Work ready to review";
        String what = event.resubmission() ? " sent updated work for " : " submitted work for ";
        return new PushMessage(
                title,
                event.creatorName() + what + "\"" + event.jobTitle() + "\". Please review it.",
                Map.of("type", "work-submitted", "jobId", event.jobId().toString()));
    }
}
