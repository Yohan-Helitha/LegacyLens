package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.WorkFeedbackResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;
import lk.ac.sliit.legacylens.marketplace.event.WorkFeedbackGivenEvent;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkProgressRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkFeedbackServiceImplTest {

    @Mock private JobRepository jobRepository;
    @Mock private JobWorkProgressRepository progressRepository;
    @Mock private ApplicationEventPublisher events;

    private WorkFeedbackServiceImpl service;
    private User elder;
    private User creator;
    private Job job;
    private JobWorkProgress progress;

    @BeforeEach
    void setUp() {
        service = new WorkFeedbackServiceImpl(jobRepository, progressRepository, events);

        elder = new User();
        elder.setId(UUID.randomUUID());
        creator = new User();
        creator.setId(UUID.randomUUID());
        job = new Job();
        job.setId(UUID.randomUUID());
        job.setTitle("Traditional recipe documentation");
        job.setElder(elder);
        job.setCreator(creator);

        progress = new JobWorkProgress();
        progress.setJob(job);
        progress.setSubmittedAt(LocalDateTime.now());
        progress.setDraft(false);

        lenient().when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
        lenient().when(progressRepository.findByJobId(job.getId())).thenReturn(Optional.of(progress));
        lenient().when(progressRepository.save(any(JobWorkProgress.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void theKnowledgeHolderSendsItBack_andTheCreatorIsToldAboutIt() {
        WorkFeedbackResponse response = service.leaveElderFeedback(elder.getId(), job.getId(), "  Please re-record the intro  ");

        assertThat(progress.getElderFeedback()).isEqualTo("Please re-record the intro");
        assertThat(progress.isRejected()).isTrue();
        assertThat(response.getElderFeedback()).isEqualTo("Please re-record the intro");

        ArgumentCaptor<WorkFeedbackGivenEvent> event = ArgumentCaptor.forClass(WorkFeedbackGivenEvent.class);
        verify(events).publishEvent(event.capture());
        assertThat(event.getValue().creatorId()).isEqualTo(creator.getId());
        assertThat(event.getValue().from()).isEqualTo("knowledge holder");
    }

    @Test
    void theKnowledgeHolder_neverSeesTheAdminsNote() {
        progress.setAdminFeedback("Audio is too quiet");
        progress.setElderFeedback("Please re-record the intro");

        WorkFeedbackResponse seenByElder = service.elderView(elder.getId(), job.getId());

        assertThat(seenByElder.getElderFeedback()).isEqualTo("Please re-record the intro");
        assertThat(seenByElder.getAdminFeedback()).isNull();
    }

    @Test
    void theKnowledgeHolderWritingBack_doesNotAnswerWithTheAdminsNoteEither() {
        progress.setAdminFeedback("Audio is too quiet");

        WorkFeedbackResponse response = service.leaveElderFeedback(elder.getId(), job.getId(), "Fix the intro");

        assertThat(response.getAdminFeedback()).isNull();
    }

    @Test
    void theAdmin_seesWhatTheKnowledgeHolderAskedFor_andTheirOwnNote() {
        progress.setElderFeedback("Please re-record the intro");
        service.leaveAdminFeedback(job.getId(), "Audio is too quiet");

        WorkFeedbackResponse seenByAdmin = service.adminView(job.getId());

        assertThat(seenByAdmin.getElderFeedback()).isEqualTo("Please re-record the intro");
        assertThat(seenByAdmin.getAdminFeedback()).isEqualTo("Audio is too quiet");
        assertThat(progress.isRejected()).isTrue();
    }

    @Test
    void anotherKnowledgeHolder_cannotReadOrWriteFeedbackOnSomeoneElsesJob() {
        UUID stranger = UUID.randomUUID();

        assertThatThrownBy(() -> service.leaveElderFeedback(stranger, job.getId(), "x"))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.elderView(stranger, job.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(events, never()).publishEvent(any(Object.class));
    }

    @Test
    void workThatWasNeverSubmitted_cannotBeSentBack() {
        progress.setSubmittedAt(null);

        assertThatThrownBy(() -> service.leaveElderFeedback(elder.getId(), job.getId(), "x"))
                .isInstanceOf(InvalidApplicationStateException.class);
        assertThatThrownBy(() -> service.leaveAdminFeedback(job.getId(), "x"))
                .isInstanceOf(InvalidApplicationStateException.class);
    }

    // ── Approval and publication ────────────────────────────────────────────

    @Test
    void oneApproval_isNotEnough_theWorkCompletesOnlyWhenBothApprove() {
        service.approveAsElder(elder.getId(), job.getId());
        assertThat(progress.isElderApproved()).isTrue();
        assertThat(job.getStatus()).isNotEqualTo(lk.ac.sliit.legacylens.marketplace.entity.JobStatus.COMPLETED);

        service.approveAsAdmin(job.getId());

        assertThat(job.getStatus()).isEqualTo(lk.ac.sliit.legacylens.marketplace.entity.JobStatus.COMPLETED);
        assertThat(job.getCompletedAt()).isNotNull();
        ArgumentCaptor<lk.ac.sliit.legacylens.marketplace.event.WorkApprovedEvent> event = ArgumentCaptor.forClass(lk.ac.sliit.legacylens.marketplace.event.WorkApprovedEvent.class);
        verify(events).publishEvent(event.capture());
        assertThat(event.getValue().creatorId()).isEqualTo(creator.getId());
        assertThat(event.getValue().published()).isFalse();
    }

    @Test
    void anApproval_cannotComplete_whileTheOtherReviewerHasFeedbackOutstanding() {
        service.leaveElderFeedback(elder.getId(), job.getId(), "Fix the intro");

        service.approveAsAdmin(job.getId());

        assertThat(job.getStatus()).isNotEqualTo(lk.ac.sliit.legacylens.marketplace.entity.JobStatus.COMPLETED);
        assertThat(progress.isRejected()).isTrue();
        // ...and the admin can still see why.
        assertThat(service.adminView(job.getId()).getElderFeedback()).isEqualTo("Fix the intro");
        assertThat(service.adminView(job.getId()).isAdminApproved()).isTrue();
    }

    @Test
    void approvingAfterGivingFeedback_withdrawsTheNote_andClearsTheSendBack() {
        service.leaveElderFeedback(elder.getId(), job.getId(), "Fix the intro");

        service.approveAsElder(elder.getId(), job.getId());

        assertThat(progress.getElderFeedback()).isNull();
        assertThat(progress.isRejected()).isFalse();
    }

    @Test
    void feedback_takesBackThatReviewersApproval() {
        service.approveAsElder(elder.getId(), job.getId());

        service.leaveElderFeedback(elder.getId(), job.getId(), "Actually, one change");

        assertThat(progress.isElderApproved()).isFalse();
    }

    @Test
    void onlyCompletedWork_canBePublished_andOnlyOnce() {
        assertThatThrownBy(() -> service.publish(job.getId())).isInstanceOf(InvalidApplicationStateException.class);

        service.approveAsElder(elder.getId(), job.getId());
        service.approveAsAdmin(job.getId());
        service.publish(job.getId());
        service.publish(job.getId());

        assertThat(progress.getPublishedAt()).isNotNull();
        ArgumentCaptor<Object> events2 = ArgumentCaptor.forClass(Object.class);
        verify(events, org.mockito.Mockito.times(2)).publishEvent(events2.capture());
        assertThat(events2.getAllValues()).hasSize(2); // approved once, published once - not twice
    }

    @Test
    void anotherKnowledgeHolder_cannotApprove() {
        assertThatThrownBy(() -> service.approveAsElder(UUID.randomUUID(), job.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
