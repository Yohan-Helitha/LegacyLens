package lk.ac.sliit.legacylens.marketplace.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Starts the urgent alerts once a publish is saved; a failure is only logged - the publish always stands. */
@Component
public class UrgentOpportunityNotifier {

    private static final Logger log = LoggerFactory.getLogger(UrgentOpportunityNotifier.class);

    private final UrgentOpportunityAlerts alerts;

    public UrgentOpportunityNotifier(UrgentOpportunityAlerts alerts) {
        this.alerts = alerts;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onPublished(OpportunityPublishedEvent event) {
        try {
            alerts.alertMatchingCreators(event.opportunityId());
        } catch (RuntimeException e) {
            log.warn("Could not send urgent alerts for opportunity {}", event.opportunityId(), e);
        }
    }
}
