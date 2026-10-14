package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Reminds creators, on their phone, about the work they have scheduled today. One notification per creator
 * lists all of today's jobs; each job is reminded about once. Nothing is sent before 7 am, so a job booked in
 * the night is reminded in the morning. A failure to send is only logged - it must never stop the others.
 */
@Service
public class TodayWorkReminderService {

    private static final Logger log = LoggerFactory.getLogger(TodayWorkReminderService.class);

    /** Creators and elders are in Sri Lanka, and a job's scheduled time is a local time with no zone. */
    public static final ZoneId LOCAL_ZONE = ZoneId.of("Asia/Colombo");
    static final LocalTime EARLIEST_REMINDER = LocalTime.of(7, 0);

    private static final Set<JobStatus> WORKING_STATUSES = Set.of(JobStatus.UPCOMING, JobStatus.ACTIVE);
    private static final DateTimeFormatter CLOCK = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    private final JobRepository jobRepository;
    private final PushNotificationService pushNotificationService;

    public TodayWorkReminderService(JobRepository jobRepository, PushNotificationService pushNotificationService) {
        this.jobRepository = jobRepository;
        this.pushNotificationService = pushNotificationService;
    }

    /** Sends the reminder to every creator who has work today and has not been reminded yet. Returns how many creators were told. */
    @Transactional
    public int remindEveryoneDue(LocalDateTime now) {
        if (now.toLocalTime().isBefore(EARLIEST_REMINDER)) {
            return 0;
        }
        LocalDate today = now.toLocalDate();
        // A job whose time passed more than an hour ago is no longer worth a reminder.
        LocalDateTime from = now.minusHours(1).isAfter(today.atStartOfDay()) ? now.minusHours(1) : today.atStartOfDay();
        List<Job> due = jobRepository.findByStatusInAndScheduledAtBetweenAndReminderSentAtIsNullOrderByScheduledAtAsc(
                WORKING_STATUSES, from, today.atTime(LocalTime.MAX));

        Map<UUID, List<Job>> byCreator = due.stream()
                .collect(Collectors.groupingBy(job -> job.getCreator().getId(), LinkedHashMap::new, Collectors.toList()));
        byCreator.forEach((creatorId, jobs) -> {
            send(creatorId, jobs);
            jobs.forEach(job -> job.setReminderSentAt(now));
        });
        jobRepository.saveAll(due);
        return byCreator.size();
    }

    /** Sends one creator today's reminder right now, whether or not it went out before - for trying it out. */
    @Transactional(readOnly = true)
    public int remindNow(UUID creatorId, LocalDateTime now) {
        List<Job> today = jobRepository.findByCreatorIdAndStatusInAndScheduledAtBetweenOrderByScheduledAtAsc(
                creatorId, WORKING_STATUSES, now.toLocalDate().atStartOfDay(), now.toLocalDate().atTime(LocalTime.MAX));
        if (!today.isEmpty()) {
            send(creatorId, today);
        }
        return today.size();
    }

    private void send(UUID creatorId, List<Job> jobs) {
        try {
            pushNotificationService.sendToUser(creatorId, messageFor(jobs));
        } catch (RuntimeException e) {
            log.warn("Could not send today's work reminder to creator {}", creatorId, e);
        }
    }

    static PushMessage messageFor(List<Job> jobs) {
        Map<String, String> data = Map.of("type", "today-work");
        if (jobs.size() == 1) {
            Job job = jobs.get(0);
            return new PushMessage("Today's work",
                    "\"" + job.getTitle() + "\" with " + job.getElder().getFullName() + " at " + timeOf(job) + ".", data);
        }
        String list = jobs.stream().map(job -> job.getTitle() + " (" + timeOf(job) + ")").collect(Collectors.joining(", "));
        return new PushMessage("You have " + jobs.size() + " jobs today", list, data);
    }

    /** The time range it was booked for, else the start time. */
    private static String timeOf(Job job) {
        if (job.getTimeWindowText() != null && !job.getTimeWindowText().isBlank()) {
            return job.getTimeWindowText();
        }
        return job.getScheduledAt() == null ? "today" : job.getScheduledAt().format(CLOCK);
    }
}
