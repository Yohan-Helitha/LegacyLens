package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.exception.StateTransitionException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestResponse;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestSubmissionDto;
import lk.ac.sliit.legacylens.hiring.entity.InputMode;
import lk.ac.sliit.legacylens.hiring.entity.JobRequest;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobRequestServiceImplTest {

    private static final UUID ELDER_ID = UUID.randomUUID();
    private static final UUID JOB_REQUEST_ID = UUID.randomUUID();

    @Mock
    private JobRequestRepository jobRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private JobRequestStateMachine jobRequestStateMachine;

    @Mock
    private AdminNotificationPort adminNotificationPort;

    private JobRequestServiceImpl jobRequestService;

    @BeforeEach
    void setUp() {
        jobRequestService = new JobRequestServiceImpl(
                jobRequestRepository, userRepository, fileStorageService, jobRequestStateMachine, adminNotificationPort);
    }

    private User buildElder() {
        User elder = new User();
        elder.setId(ELDER_ID);
        elder.setFullName("Kasun Perera");
        return elder;
    }

    private JobRequestSubmissionDto buildRequest(String description) {
        JobRequestSubmissionDto dto = new JobRequestSubmissionDto();
        dto.setTitle("Record my fishing stories");
        dto.setDescription(description);
        dto.setInputMode(InputMode.TEXT);
        return dto;
    }

    @Test
    void submit_validRequest_setsStatusPendingReview() {
        when(userRepository.findById(ELDER_ID)).thenReturn(Optional.of(buildElder()));

        JobRequestResponse response = jobRequestService.submit(ELDER_ID, buildRequest("I need someone to film my pottery work"));

        assertThat(response.getStatus()).isEqualTo("PENDING_ADMIN_REVIEW");

        ArgumentCaptor<JobRequest> captor = ArgumentCaptor.forClass(JobRequest.class);
        verify(jobRequestRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(JobRequestStatus.PENDING_ADMIN_REVIEW);
    }

    @Test
    void submit_callsAdminNotificationPort() {
        when(userRepository.findById(ELDER_ID)).thenReturn(Optional.of(buildElder()));

        jobRequestService.submit(ELDER_ID, buildRequest("A description"));

        verify(adminNotificationPort).notify(any());
    }

    @Test
    void submit_emptyDescriptionAndNoVoiceInput_throwsValidationException() {
        JobRequestSubmissionDto dto = buildRequest(null);
        dto.setVoiceNote(null);

        assertThrows(InvalidRequestException.class, () -> jobRequestService.submit(ELDER_ID, dto));

        verify(jobRequestRepository, never()).save(any());
        verify(adminNotificationPort, never()).notify(any());
    }

    @Test
    void submit_blankDescriptionButHasVoiceNote_succeeds() {
        when(userRepository.findById(ELDER_ID)).thenReturn(Optional.of(buildElder()));
        when(fileStorageService.store(any(), eq("job-requests"))).thenReturn("job-requests/clip.m4a");

        JobRequestSubmissionDto dto = buildRequest("   ");
        dto.setInputMode(InputMode.VOICE);
        dto.setVoiceNote(new MockMultipartFile("voiceNote", "clip.m4a", "audio/m4a", "x".getBytes()));

        JobRequestResponse response = jobRequestService.submit(ELDER_ID, dto);

        assertThat(response.getVoiceNoteUrl()).isEqualTo("/uploads/job-requests/clip.m4a");
    }

    @Test
    void saveDraft_setsStatusDraft_andDoesNotNotifyAdmin() {
        when(userRepository.findById(ELDER_ID)).thenReturn(Optional.of(buildElder()));

        JobRequestResponse response = jobRequestService.saveDraft(ELDER_ID, buildRequest("Draft description"));

        assertThat(response.getStatus()).isEqualTo("DRAFT");
        verify(adminNotificationPort, never()).notify(any());
    }

    @Test
    void submitDraft_validTransition_promotesToPendingReviewAndNotifies() {
        JobRequest draft = new JobRequest();
        draft.setId(JOB_REQUEST_ID);
        draft.setElder(buildElder());
        draft.setStatus(JobRequestStatus.DRAFT);
        draft.setInputMode(InputMode.TEXT);
        when(jobRequestRepository.findByIdAndElderId(JOB_REQUEST_ID, ELDER_ID)).thenReturn(Optional.of(draft));
        when(jobRequestStateMachine.canTransition(JobRequestStatus.DRAFT, JobRequestStatus.PENDING_ADMIN_REVIEW))
                .thenReturn(true);

        JobRequestResponse response = jobRequestService.submitDraft(ELDER_ID, JOB_REQUEST_ID);

        assertThat(response.getStatus()).isEqualTo("PENDING_ADMIN_REVIEW");
        verify(adminNotificationPort).notify(JOB_REQUEST_ID);
    }

    @Test
    void submitDraft_invalidTransition_throwsStateTransitionException() {
        JobRequest published = new JobRequest();
        published.setId(JOB_REQUEST_ID);
        published.setElder(buildElder());
        published.setStatus(JobRequestStatus.PUBLISHED);
        when(jobRequestRepository.findByIdAndElderId(JOB_REQUEST_ID, ELDER_ID)).thenReturn(Optional.of(published));
        when(jobRequestStateMachine.canTransition(JobRequestStatus.PUBLISHED, JobRequestStatus.PENDING_ADMIN_REVIEW))
                .thenReturn(false);

        assertThrows(StateTransitionException.class, () -> jobRequestService.submitDraft(ELDER_ID, JOB_REQUEST_ID));

        verify(adminNotificationPort, never()).notify(any());
    }

    @Test
    void submitDraft_notFound_throwsResourceNotFound() {
        when(jobRequestRepository.findByIdAndElderId(JOB_REQUEST_ID, ELDER_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> jobRequestService.submitDraft(ELDER_ID, JOB_REQUEST_ID));
    }
}
