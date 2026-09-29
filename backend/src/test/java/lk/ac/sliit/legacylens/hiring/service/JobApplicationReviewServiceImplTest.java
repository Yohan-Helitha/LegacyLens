package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.common.exception.ForbiddenOperationException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.exception.StateTransitionException;
import lk.ac.sliit.legacylens.hiring.entity.JobApplication;
import lk.ac.sliit.legacylens.hiring.entity.JobApplicationStatus;
import lk.ac.sliit.legacylens.hiring.entity.JobRequest;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lk.ac.sliit.legacylens.hiring.repository.JobApplicationRepository;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobApplicationReviewServiceImplTest {

    private static final UUID ELDER_ID = UUID.randomUUID();
    private static final UUID OTHER_ELDER_ID = UUID.randomUUID();
    private static final UUID JOB_REQUEST_ID = UUID.randomUUID();
    private static final UUID TARGET_APPLICATION_ID = UUID.randomUUID();
    private static final UUID CREATOR_ID = UUID.randomUUID();

    @Mock
    private JobRequestRepository jobRequestRepository;

    @Mock
    private JobApplicationRepository jobApplicationRepository;

    @Mock
    private JobRequestStateMachine jobRequestStateMachine;

    @Mock
    private MessagingChannelPort messagingChannelPort;

    private JobApplicationReviewServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new JobApplicationReviewServiceImpl(
                jobRequestRepository, jobApplicationRepository, jobRequestStateMachine, messagingChannelPort);
    }

    private JobRequest buildJobRequest(UUID elderId, JobRequestStatus status) {
        User elder = new User();
        elder.setId(elderId);

        JobRequest jobRequest = new JobRequest();
        jobRequest.setId(JOB_REQUEST_ID);
        jobRequest.setElder(elder);
        jobRequest.setStatus(status);
        return jobRequest;
    }

    private JobApplication buildApplication(UUID id, UUID creatorId, JobApplicationStatus status) {
        User creator = new User();
        creator.setId(creatorId);

        JobApplication application = new JobApplication();
        application.setId(id);
        application.setCreator(creator);
        application.setStatus(status);
        return application;
    }

    // ── approve ───────────────────────────────────────────────────────────

    @Test
    void approve_setsTargetAccepted() {
        JobRequest jobRequest = buildJobRequest(ELDER_ID, JobRequestStatus.PUBLISHED);
        JobApplication target = buildApplication(TARGET_APPLICATION_ID, CREATOR_ID, JobApplicationStatus.PENDING);

        when(jobRequestRepository.findById(JOB_REQUEST_ID)).thenReturn(Optional.of(jobRequest));
        when(jobRequestStateMachine.canTransition(JobRequestStatus.PUBLISHED, JobRequestStatus.CLOSED)).thenReturn(true);
        when(jobApplicationRepository.findByIdAndJobRequestId(TARGET_APPLICATION_ID, JOB_REQUEST_ID))
                .thenReturn(Optional.of(target));
        when(jobApplicationRepository.findByJobRequestIdAndStatus(JOB_REQUEST_ID, JobApplicationStatus.PENDING))
                .thenReturn(List.of());

        service.approve(JOB_REQUEST_ID, TARGET_APPLICATION_ID, ELDER_ID);

        assertThat(target.getStatus()).isEqualTo(JobApplicationStatus.ACCEPTED);
        verify(jobApplicationRepository).save(target);
    }

    @Test
    void approve_rejectsAllOtherPendingApplications() {
        JobRequest jobRequest = buildJobRequest(ELDER_ID, JobRequestStatus.PUBLISHED);
        JobApplication target = buildApplication(TARGET_APPLICATION_ID, CREATOR_ID, JobApplicationStatus.PENDING);
        JobApplication other1 = buildApplication(UUID.randomUUID(), UUID.randomUUID(), JobApplicationStatus.PENDING);
        JobApplication other2 = buildApplication(UUID.randomUUID(), UUID.randomUUID(), JobApplicationStatus.PENDING);

        when(jobRequestRepository.findById(JOB_REQUEST_ID)).thenReturn(Optional.of(jobRequest));
        when(jobRequestStateMachine.canTransition(JobRequestStatus.PUBLISHED, JobRequestStatus.CLOSED)).thenReturn(true);
        when(jobApplicationRepository.findByIdAndJobRequestId(TARGET_APPLICATION_ID, JOB_REQUEST_ID))
                .thenReturn(Optional.of(target));
        // approve() marks `target` ACCEPTED before this query runs; the two
        // "others" are what's still PENDING at that point.
        when(jobApplicationRepository.findByJobRequestIdAndStatus(JOB_REQUEST_ID, JobApplicationStatus.PENDING))
                .thenReturn(List.of(other1, other2));

        service.approve(JOB_REQUEST_ID, TARGET_APPLICATION_ID, ELDER_ID);

        assertThat(other1.getStatus()).isEqualTo(JobApplicationStatus.REJECTED);
        assertThat(other1.getRejectionReason()).isNull();
        assertThat(other2.getStatus()).isEqualTo(JobApplicationStatus.REJECTED);
        assertThat(other2.getRejectionReason()).isNull();
    }

    @Test
    void approve_closesParentJobRequest() {
        JobRequest jobRequest = buildJobRequest(ELDER_ID, JobRequestStatus.PUBLISHED);
        JobApplication target = buildApplication(TARGET_APPLICATION_ID, CREATOR_ID, JobApplicationStatus.PENDING);

        when(jobRequestRepository.findById(JOB_REQUEST_ID)).thenReturn(Optional.of(jobRequest));
        when(jobRequestStateMachine.canTransition(JobRequestStatus.PUBLISHED, JobRequestStatus.CLOSED)).thenReturn(true);
        when(jobApplicationRepository.findByIdAndJobRequestId(TARGET_APPLICATION_ID, JOB_REQUEST_ID))
                .thenReturn(Optional.of(target));
        when(jobApplicationRepository.findByJobRequestIdAndStatus(JOB_REQUEST_ID, JobApplicationStatus.PENDING))
                .thenReturn(List.of());

        service.approve(JOB_REQUEST_ID, TARGET_APPLICATION_ID, ELDER_ID);

        assertThat(jobRequest.getStatus()).isEqualTo(JobRequestStatus.CLOSED);
        verify(jobRequestRepository).save(jobRequest);
    }

    @Test
    void approve_callsMessagingChannelPort() {
        JobRequest jobRequest = buildJobRequest(ELDER_ID, JobRequestStatus.PUBLISHED);
        JobApplication target = buildApplication(TARGET_APPLICATION_ID, CREATOR_ID, JobApplicationStatus.PENDING);

        when(jobRequestRepository.findById(JOB_REQUEST_ID)).thenReturn(Optional.of(jobRequest));
        when(jobRequestStateMachine.canTransition(JobRequestStatus.PUBLISHED, JobRequestStatus.CLOSED)).thenReturn(true);
        when(jobApplicationRepository.findByIdAndJobRequestId(TARGET_APPLICATION_ID, JOB_REQUEST_ID))
                .thenReturn(Optional.of(target));
        when(jobApplicationRepository.findByJobRequestIdAndStatus(JOB_REQUEST_ID, JobApplicationStatus.PENDING))
                .thenReturn(List.of());

        service.approve(JOB_REQUEST_ID, TARGET_APPLICATION_ID, ELDER_ID);

        verify(messagingChannelPort).openConversation(ELDER_ID, CREATOR_ID);
    }

    @Test
    void approve_nonOwnerElder_throwsAccessDenied() {
        JobRequest jobRequest = buildJobRequest(OTHER_ELDER_ID, JobRequestStatus.PUBLISHED);
        when(jobRequestRepository.findById(JOB_REQUEST_ID)).thenReturn(Optional.of(jobRequest));

        assertThrows(ForbiddenOperationException.class,
                () -> service.approve(JOB_REQUEST_ID, TARGET_APPLICATION_ID, ELDER_ID));

        verify(jobApplicationRepository, never()).save(any());
        verify(messagingChannelPort, never()).openConversation(any(), any());
    }

    @Test
    void approve_alreadyClosedJob_throwsStateTransitionException() {
        JobRequest jobRequest = buildJobRequest(ELDER_ID, JobRequestStatus.CLOSED);
        when(jobRequestRepository.findById(JOB_REQUEST_ID)).thenReturn(Optional.of(jobRequest));
        when(jobRequestStateMachine.canTransition(JobRequestStatus.CLOSED, JobRequestStatus.CLOSED)).thenReturn(false);

        assertThrows(StateTransitionException.class,
                () -> service.approve(JOB_REQUEST_ID, TARGET_APPLICATION_ID, ELDER_ID));

        verify(jobApplicationRepository, never()).save(any());
    }

    // ── reject ────────────────────────────────────────────────────────────

    @Test
    void reject_withReason_storesReasonText() {
        JobRequest jobRequest = buildJobRequest(ELDER_ID, JobRequestStatus.PUBLISHED);
        JobApplication target = buildApplication(TARGET_APPLICATION_ID, CREATOR_ID, JobApplicationStatus.PENDING);

        when(jobRequestRepository.findById(JOB_REQUEST_ID)).thenReturn(Optional.of(jobRequest));
        when(jobApplicationRepository.findByIdAndJobRequestId(TARGET_APPLICATION_ID, JOB_REQUEST_ID))
                .thenReturn(Optional.of(target));

        service.reject(JOB_REQUEST_ID, TARGET_APPLICATION_ID, ELDER_ID, "Not a good fit for this project");

        assertThat(target.getStatus()).isEqualTo(JobApplicationStatus.REJECTED);
        assertThat(target.getRejectionReason()).isEqualTo("Not a good fit for this project");
    }

    @Test
    void reject_withoutReason_succeedsWithNullReason() {
        JobRequest jobRequest = buildJobRequest(ELDER_ID, JobRequestStatus.PUBLISHED);
        JobApplication target = buildApplication(TARGET_APPLICATION_ID, CREATOR_ID, JobApplicationStatus.PENDING);

        when(jobRequestRepository.findById(JOB_REQUEST_ID)).thenReturn(Optional.of(jobRequest));
        when(jobApplicationRepository.findByIdAndJobRequestId(TARGET_APPLICATION_ID, JOB_REQUEST_ID))
                .thenReturn(Optional.of(target));

        service.reject(JOB_REQUEST_ID, TARGET_APPLICATION_ID, ELDER_ID, null);

        assertThat(target.getStatus()).isEqualTo(JobApplicationStatus.REJECTED);
        assertThat(target.getRejectionReason()).isNull();
    }

    @Test
    void reject_singleApplication_doesNotAffectOthers() {
        JobRequest jobRequest = buildJobRequest(ELDER_ID, JobRequestStatus.PUBLISHED);
        JobApplication target = buildApplication(TARGET_APPLICATION_ID, CREATOR_ID, JobApplicationStatus.PENDING);

        when(jobRequestRepository.findById(JOB_REQUEST_ID)).thenReturn(Optional.of(jobRequest));
        when(jobApplicationRepository.findByIdAndJobRequestId(TARGET_APPLICATION_ID, JOB_REQUEST_ID))
                .thenReturn(Optional.of(target));

        service.reject(JOB_REQUEST_ID, TARGET_APPLICATION_ID, ELDER_ID, "reason");

        verify(jobApplicationRepository, times(1)).save(any());
        verify(jobApplicationRepository, never()).findByJobRequestIdAndStatus(any(), any());
        verify(jobRequestRepository, never()).save(any());
    }

    @Test
    void reject_nonOwnerElder_throwsAccessDenied() {
        JobRequest jobRequest = buildJobRequest(OTHER_ELDER_ID, JobRequestStatus.PUBLISHED);
        when(jobRequestRepository.findById(JOB_REQUEST_ID)).thenReturn(Optional.of(jobRequest));

        assertThrows(ForbiddenOperationException.class,
                () -> service.reject(JOB_REQUEST_ID, TARGET_APPLICATION_ID, ELDER_ID, "reason"));

        verify(jobApplicationRepository, never()).save(any());
    }

    @Test
    void reject_jobRequestNotFound_throwsResourceNotFound() {
        when(jobRequestRepository.findById(JOB_REQUEST_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.reject(JOB_REQUEST_ID, TARGET_APPLICATION_ID, ELDER_ID, "reason"));
    }
}
