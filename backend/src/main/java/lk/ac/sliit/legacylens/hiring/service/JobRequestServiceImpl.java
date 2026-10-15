package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.admin.entity.AudioReviewStatus;
import lk.ac.sliit.legacylens.admin.entity.OpportunityAudio;
import lk.ac.sliit.legacylens.admin.repository.OpportunityAudioRepository;
import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.exception.StateTransitionException;
import lk.ac.sliit.legacylens.common.storage.MediaStorageService;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestResponse;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestSubmissionDto;
import lk.ac.sliit.legacylens.hiring.entity.JobRequest;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Service
public class JobRequestServiceImpl implements JobRequestService {

    private static final Logger log = LoggerFactory.getLogger(JobRequestServiceImpl.class);

    /** Subfolder under the storage root that job-request voice notes are saved into. */
    private static final String VOICE_NOTE_SUBFOLDER = "job-requests";

    /** How long after posting an elder can still delete a request outright — see delete(). */
    private static final Duration DELETE_WINDOW = Duration.ofHours(1);

    /** Deletable only before an admin has acted on it — a published/rejected/closed request stays, even inside the window. */
    private static final Set<JobRequestStatus> DELETABLE_STATUSES =
            Set.of(JobRequestStatus.DRAFT, JobRequestStatus.PENDING_ADMIN_REVIEW);

    private final JobRequestRepository jobRequestRepository;
    private final UserRepository userRepository;
    private final MediaStorageService mediaStorageService;
    private final JobRequestStateMachine jobRequestStateMachine;
    private final AdminNotificationPort adminNotificationPort;
    private final OpportunityAudioRepository opportunityAudioRepository;

    public JobRequestServiceImpl(
            JobRequestRepository jobRequestRepository,
            UserRepository userRepository,
            MediaStorageService mediaStorageService,
            JobRequestStateMachine jobRequestStateMachine,
            AdminNotificationPort adminNotificationPort,
            OpportunityAudioRepository opportunityAudioRepository) {

        this.jobRequestRepository = jobRequestRepository;
        this.userRepository = userRepository;
        this.mediaStorageService = mediaStorageService;
        this.jobRequestStateMachine = jobRequestStateMachine;
        this.adminNotificationPort = adminNotificationPort;
        this.opportunityAudioRepository = opportunityAudioRepository;
    }

    @Override
    @Transactional
    public JobRequestResponse submit(UUID elderId, JobRequestSubmissionDto request) {
        JobRequest jobRequest = buildJobRequest(elderId, request);
        jobRequest.setStatus(JobRequestStatus.PENDING_ADMIN_REVIEW);
        jobRequestRepository.save(jobRequest);

        adminNotificationPort.notify(jobRequest.getId());

        // Automatically feed data into opportunity_audios table for the admin dashboard
        syncToOpportunityAudio(jobRequest);

        return JobRequestResponse.from(jobRequest);
    }

    @Override
    @Transactional
    public JobRequestResponse saveDraft(UUID elderId, JobRequestSubmissionDto request) {
        JobRequest jobRequest = buildJobRequest(elderId, request);
        jobRequest.setStatus(JobRequestStatus.DRAFT);
        jobRequestRepository.save(jobRequest);

        return JobRequestResponse.from(jobRequest);
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

        // Automatically feed data into opportunity_audios table for the admin dashboard
        syncToOpportunityAudio(jobRequest);

        return JobRequestResponse.from(jobRequest);
    }

    @Override
    @Transactional
    public void delete(UUID elderId, UUID jobRequestId) {
        JobRequest jobRequest = jobRequestRepository.findByIdAndElderId(jobRequestId, elderId)
                .orElseThrow(() -> new ResourceNotFoundException("Job request not found"));

        if (!DELETABLE_STATUSES.contains(jobRequest.getStatus())) {
            throw new StateTransitionException(
                    "Can't delete a job request once it's " + jobRequest.getStatus());
        }
        if (LocalDateTime.now().isAfter(jobRequest.getCreatedAt().plus(DELETE_WINDOW))) {
            throw new StateTransitionException(
                    "This request can only be deleted within " + DELETE_WINDOW.toHours() + " hour of sending it");
        }

        mediaStorageService.delete(jobRequest.getVoiceNoteUrl());
        if (jobRequest.getVoiceNoteUrl() != null && !jobRequest.getVoiceNoteUrl().isBlank()) {
            try {
                opportunityAudioRepository.findByAudioUrl(jobRequest.getVoiceNoteUrl())
                        .ifPresent(opportunityAudioRepository::delete);
            } catch (Exception e) {
                log.warn("Could not remove OpportunityAudio on job request delete: {}", e.getMessage());
            }
        }
        jobRequestRepository.delete(jobRequest);
    }

    private void syncToOpportunityAudio(JobRequest jr) {
        if (jr == null || jr.getElder() == null) {
            return;
        }
        try {
            User elder = jr.getElder();
            String audioUrl = jr.getVoiceNoteUrl();
            if (audioUrl == null || audioUrl.isBlank()) {
                audioUrl = "job-request://" + jr.getId();
            }

            OpportunityAudio audio = opportunityAudioRepository.findByAudioUrl(audioUrl)
                    .orElseGet(OpportunityAudio::new);

            audio.setKnowledgeHolder(elder);
            audio.setElderName(elder.getFullName() != null ? elder.getFullName() : "Elder Knowledge Keeper");
            audio.setElderAvatarUrl(elder.getProfilePhotoUrl());
            audio.setVerified(elder.isPhoneVerified());

            String location = "Sri Lanka";
            if (elder.getCity() != null) {
                location = elder.getCity().getName() + (elder.getCity().getRegion() != null ? ", " + elder.getCity().getRegion() : "");
            }
            audio.setLocation(location);
            audio.setRecordedAt(jr.getCreatedAt() != null ? jr.getCreatedAt() : LocalDateTime.now());
            audio.setDuration("02:45");
            audio.setAudioUrl(audioUrl);
            audio.setTopic(jr.getTitle());
            audio.setTags("Oral History, Cultural Documentation, Traditional Heritage");
            audio.setTranscript(jr.getDescription() != null && !jr.getDescription().isBlank() ? jr.getDescription() : jr.getTitle());
            audio.setStatus(AudioReviewStatus.UNLISTENED);

            opportunityAudioRepository.save(audio);
            log.info("Auto-synced job_request {} to opportunity_audios (id: {})", jr.getId(), audio.getId());
        } catch (Exception e) {
            log.error("Failed to auto-sync job_request {} to opportunity_audios: {}", jr.getId(), e.getMessage());
        }
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
            jobRequest.setVoiceNoteUrl(mediaStorageService.store(request.getVoiceNote(), VOICE_NOTE_SUBFOLDER));
        }

        return jobRequest;
    }
}
