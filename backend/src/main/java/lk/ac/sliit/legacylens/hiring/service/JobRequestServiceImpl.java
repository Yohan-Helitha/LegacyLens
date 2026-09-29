package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.exception.StateTransitionException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestResponse;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestSubmissionDto;
import lk.ac.sliit.legacylens.hiring.entity.JobRequest;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
public class JobRequestServiceImpl implements JobRequestService {

    /** Subfolder under the storage root that job-request voice notes are saved into. */
    private static final String VOICE_NOTE_SUBFOLDER = "job-requests";

    private final JobRequestRepository jobRequestRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final JobRequestStateMachine jobRequestStateMachine;
    private final AdminNotificationPort adminNotificationPort;

    public JobRequestServiceImpl(
            JobRequestRepository jobRequestRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService,
            JobRequestStateMachine jobRequestStateMachine,
            AdminNotificationPort adminNotificationPort) {

        this.jobRequestRepository = jobRequestRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.jobRequestStateMachine = jobRequestStateMachine;
        this.adminNotificationPort = adminNotificationPort;
    }

    @Override
    @Transactional
    public JobRequestResponse submit(UUID elderId, JobRequestSubmissionDto request) {
        JobRequest jobRequest = buildJobRequest(elderId, request);
        jobRequest.setStatus(JobRequestStatus.PENDING_ADMIN_REVIEW);
        jobRequestRepository.save(jobRequest);

        adminNotificationPort.notify(jobRequest.getId());

        return toResponse(jobRequest);
    }

    @Override
    @Transactional
    public JobRequestResponse saveDraft(UUID elderId, JobRequestSubmissionDto request) {
        JobRequest jobRequest = buildJobRequest(elderId, request);
        jobRequest.setStatus(JobRequestStatus.DRAFT);
        jobRequestRepository.save(jobRequest);

        return toResponse(jobRequest);
    }

    @Override
    @Transactional
    public JobRequestResponse submitDraft(UUID elderId, UUID jobRequestId) {
        JobRequest jobRequest = jobRequestRepository.findByIdAndElderId(jobRequestId, elderId)
                .orElseThrow(() -> new ResourceNotFoundException("Job request not found"));

        if (!jobRequestStateMachine.canTransition(jobRequest.getStatus(), JobRequestStatus.PENDING_ADMIN_REVIEW)) {
            throw new StateTransitionException(
                    "Can't submit a job request from status " + jobRequest.getStatus());
        }

        jobRequest.setStatus(JobRequestStatus.PENDING_ADMIN_REVIEW);
        jobRequestRepository.save(jobRequest);

        adminNotificationPort.notify(jobRequest.getId());

        return toResponse(jobRequest);
    }

    private JobRequest buildJobRequest(UUID elderId, JobRequestSubmissionDto request) {
        boolean hasDescription = request.getDescription() != null && !request.getDescription().isBlank();
        boolean hasVoiceNote = request.getVoiceNote() != null && !request.getVoiceNote().isEmpty();

        if (!hasDescription && !hasVoiceNote) {
            throw new InvalidRequestException("Either a description or a voice recording is required");
        }

        User elder = userRepository.findById(elderId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        JobRequest jobRequest = new JobRequest();
        jobRequest.setElder(elder);
        jobRequest.setTitle(request.getTitle());
        jobRequest.setDescription(request.getDescription());
        jobRequest.setInputMode(request.getInputMode());

        if (hasVoiceNote) {
            String relativePath = fileStorageService.store(request.getVoiceNote(), VOICE_NOTE_SUBFOLDER);
            jobRequest.setVoiceNoteUrl("/uploads/" + relativePath);
        }

        return jobRequest;
    }

    private JobRequestResponse toResponse(JobRequest jobRequest) {
        return JobRequestResponse.builder()
                .id(jobRequest.getId())
                .title(jobRequest.getTitle())
                .description(jobRequest.getDescription())
                .inputMode(jobRequest.getInputMode().name())
                .status(jobRequest.getStatus().name())
                .adminNotes(jobRequest.getAdminNotes())
                .voiceNoteUrl(jobRequest.getVoiceNoteUrl())
                .createdAt(jobRequest.getCreatedAt())
                .build();
    }
}
