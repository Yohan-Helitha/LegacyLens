package lk.ac.sliit.legacylens.marketplace.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * When the backend starts, publishes any creator work that both reviewers approved but that never reached the
 * users' feed - work approved before publishing was automatic. Idempotent: work already in the feed is left
 * alone, so running on every start is harmless. A failure here is logged and never stops the backend starting.
 */
@Component
public class ApprovedWorkBacklogPublisher implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ApprovedWorkBacklogPublisher.class);

    private final WorkFeedbackService workFeedbackService;

    public ApprovedWorkBacklogPublisher(WorkFeedbackService workFeedbackService) {
        this.workFeedbackService = workFeedbackService;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            int published = workFeedbackService.publishBacklog();
            if (published > 0) {
                log.info("Published {} piece(s) of approved creator work that was not in the feed yet", published);
            }
        } catch (Exception ex) {
            log.warn("Could not publish approved creator work at start-up: {}", ex.getMessage());
        }
    }
}
