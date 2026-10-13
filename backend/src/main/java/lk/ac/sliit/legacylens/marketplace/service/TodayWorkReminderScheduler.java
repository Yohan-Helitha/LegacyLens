package lk.ac.sliit.legacylens.marketplace.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/** Checks every 15 minutes for creators with work today who have not been reminded yet. */
@Component
public class TodayWorkReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(TodayWorkReminderScheduler.class);

    private final TodayWorkReminderService reminderService;

    public TodayWorkReminderScheduler(TodayWorkReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @Scheduled(initialDelay = 60_000, fixedDelay = 15 * 60_000)
    public void remindCreators() {
        try {
            int told = reminderService.remindEveryoneDue(LocalDateTime.now(TodayWorkReminderService.LOCAL_ZONE));
            if (told > 0) {
                log.info("Sent today's work reminder to {} creator(s)", told);
            }
        } catch (RuntimeException e) {
            log.warn("Today's work reminders failed; will try again at the next check", e);
        }
    }
}
