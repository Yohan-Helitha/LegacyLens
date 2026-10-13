package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TodayWorkReminderServiceTest {

    @Mock private JobRepository jobRepository;
    @Mock private PushNotificationService push;

    private TodayWorkReminderService service;
    private final LocalDate today = LocalDate.of(2026, 10, 12);

    @BeforeEach
    void setUp() {
        service = new TodayWorkReminderService(jobRepository, push);
    }

    private Job job(UUID creatorId, String title, int hour, String window) {
        User creator = new User();
        creator.setId(creatorId);
        User elder = new User();
        elder.setId(UUID.randomUUID());
        elder.setFullName("Mrs. Kamala");
        Job job = new Job();
        job.setId(UUID.randomUUID());
        job.setCreator(creator);
        job.setElder(elder);
        job.setTitle(title);
        job.setStatus(JobStatus.UPCOMING);
        job.setScheduledAt(today.atTime(hour, 0));
        job.setTimeWindowText(window);
        return job;
    }

    @Test
    void oneJobGetsASingleLineReminderAndIsMarkedSent() {
        UUID creatorId = UUID.randomUUID();
        Job job = job(creatorId, "Family Recipe", 14, "2:00 PM - 4:00 PM");
        when(jobRepository.findByStatusInAndScheduledAtBetweenAndReminderSentAtIsNullOrderByScheduledAtAsc(any(), any(), any()))
                .thenReturn(List.of(job));

        int told = service.remindEveryoneDue(today.atTime(8, 0));

        assertThat(told).isEqualTo(1);
        ArgumentCaptor<PushMessage> sent = ArgumentCaptor.forClass(PushMessage.class);
        verify(push).sendToUser(eq(creatorId), sent.capture());
        assertThat(sent.getValue().title()).isEqualTo("Today's work");
        assertThat(sent.getValue().body()).contains("Family Recipe").contains("Mrs. Kamala").contains("2:00 PM - 4:00 PM");
        assertThat(sent.getValue().data()).containsEntry("type", "today-work");
        assertThat(job.getReminderSentAt()).isNotNull();
    }

    @Test
    void severalJobsForOneCreatorArriveAsOneNotification() {
        UUID creatorId = UUID.randomUUID();
        when(jobRepository.findByStatusInAndScheduledAtBetweenAndReminderSentAtIsNullOrderByScheduledAtAsc(any(), any(), any()))
                .thenReturn(List.of(job(creatorId, "Mask Photos", 9, "9:00 AM - 11:00 AM"), job(creatorId, "Recipe", 14, null)));

        int told = service.remindEveryoneDue(today.atTime(8, 30));

        assertThat(told).isEqualTo(1);
        ArgumentCaptor<PushMessage> sent = ArgumentCaptor.forClass(PushMessage.class);
        verify(push).sendToUser(eq(creatorId), sent.capture());
        assertThat(sent.getValue().title()).isEqualTo("You have 2 jobs today");
        assertThat(sent.getValue().body()).contains("Mask Photos (9:00 AM - 11:00 AM)").contains("Recipe (2:00 PM)");
    }

    @Test
    void nothingIsSentBeforeSevenInTheMorning() {
        int told = service.remindEveryoneDue(today.atTime(5, 45));

        assertThat(told).isZero();
        verify(push, never()).sendToUser(any(), any());
        verify(jobRepository, never()).saveAll(any());
    }

    @Test
    void aFailedSendDoesNotStopTheRestOrLeaveTheJobUnmarked() {
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();
        Job a = job(first, "A", 9, null);
        Job b = job(second, "B", 10, null);
        when(jobRepository.findByStatusInAndScheduledAtBetweenAndReminderSentAtIsNullOrderByScheduledAtAsc(any(), any(), any()))
                .thenReturn(List.of(a, b));
        org.mockito.Mockito.doThrow(new RuntimeException("push down")).when(push).sendToUser(eq(first), any());

        int told = service.remindEveryoneDue(today.atTime(8, 0));

        assertThat(told).isEqualTo(2);
        verify(push).sendToUser(eq(second), any());
        assertThat(b.getReminderSentAt()).isNotNull();
    }

    @Test
    void remindNowSendsEvenIfAlreadyReminded() {
        UUID creatorId = UUID.randomUUID();
        Job job = job(creatorId, "Family Recipe", 14, null);
        job.setReminderSentAt(today.atTime(7, 0));
        when(jobRepository.findByCreatorIdAndStatusInAndScheduledAtBetweenOrderByScheduledAtAsc(eq(creatorId), any(), any(), any()))
                .thenReturn(List.of(job));

        assertThat(service.remindNow(creatorId, today.atTime(12, 0))).isEqualTo(1);
        verify(push).sendToUser(eq(creatorId), any());
    }
}
