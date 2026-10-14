package lk.ac.sliit.legacylens.admin.service;

import jakarta.annotation.PostConstruct;
import lk.ac.sliit.legacylens.admin.dto.AdminOpportunityResponse;
import lk.ac.sliit.legacylens.admin.dto.CreateOpportunityRequest;
import lk.ac.sliit.legacylens.admin.dto.OpportunityAudioResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateOpportunityStatusRequest;
import lk.ac.sliit.legacylens.admin.entity.AudioReviewStatus;
import lk.ac.sliit.legacylens.admin.entity.AuditActionType;
import lk.ac.sliit.legacylens.admin.entity.OpportunityAudio;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.hiring.entity.JobRequest;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.admin.repository.OpportunityAudioRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import lk.ac.sliit.legacylens.marketplace.event.OpportunityPublishedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminOpportunityServiceImpl implements AdminOpportunityService {

    private static final Logger log = LoggerFactory.getLogger(AdminOpportunityServiceImpl.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final OpportunityAudioRepository opportunityAudioRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final AdminAuditService auditService;
    private final ApplicationEventPublisher events;
    private final JobRequestRepository jobRequestRepository;

    public AdminOpportunityServiceImpl(
            OpportunityAudioRepository opportunityAudioRepository,
            OpportunityRepository opportunityRepository,
            UserRepository userRepository,
            AdminAuditService auditService,
            ApplicationEventPublisher events,
            JobRequestRepository jobRequestRepository) {
        this.opportunityAudioRepository = opportunityAudioRepository;
        this.opportunityRepository = opportunityRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.events = events;
        this.jobRequestRepository = jobRequestRepository;
    }

    /**
     * Auto-sync any unsynced elder job requests from job_requests table into opportunity_audios table
     * so the admin opportunity intake queue always reflects live db data.
     */
    @PostConstruct
    public void syncExistingJobRequestsOnStartup() {
        try {
            List<JobRequest> requests = jobRequestRepository.findAll();
            for (JobRequest jr : requests) {
                syncJobRequestToOpportunityAudio(jr);
            }
            log.info("Synchronized {} job_requests into opportunity_audios table on startup.", requests.size());
        } catch (Exception e) {
            log.warn("Startup sync of job_requests to opportunity_audios skipped or failed: {}", e.getMessage());
        }
    }

    private void syncJobRequestToOpportunityAudio(JobRequest jr) {
        if (jr == null || jr.getElder() == null) {
            return;
        }
        try {
            String audioUrl = jr.getVoiceNoteUrl();
            if (audioUrl == null || audioUrl.isBlank()) {
                audioUrl = "job-request://" + jr.getId();
            }

            Optional<OpportunityAudio> existing = opportunityAudioRepository.findByAudioUrl(audioUrl);
            if (existing.isPresent()) {
                return;
            }

            User elder = jr.getElder();
            OpportunityAudio audio = new OpportunityAudio();
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
            audio.setStatus(jr.getStatus() == JobRequestStatus.PUBLISHED ? AudioReviewStatus.FULLY_LISTENED : AudioReviewStatus.UNLISTENED);

            opportunityAudioRepository.save(audio);
        } catch (Exception e) {
            log.warn("Failed to sync job_request {} to opportunity_audios: {}", jr.getId(), e.getMessage());
        }
    }

    /** Tells the knowledge holder their opportunity is live; one with no knowledge holder has nobody to tell. */
    private void announcePublished(Opportunity opportunity) {
        if (opportunity.getElder() != null && opportunity.getId() != null) {
            events.publishEvent(new OpportunityPublishedEvent(
                    opportunity.getElder().getId(), opportunity.getId(), opportunity.getTitle()));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityAudioResponse> getAudioSubmissions(String statusFilter) {
        List<OpportunityAudio> audios;
        if (statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)) {
            audios = opportunityAudioRepository.findAll();
        } else {
            try {
                AudioReviewStatus status = AudioReviewStatus.valueOf(statusFilter.toUpperCase());
                audios = opportunityAudioRepository.findByStatus(status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid AudioReviewStatus filter '{}', returning all submissions", statusFilter);
                audios = opportunityAudioRepository.findAll();
            }
        }
        return audios.stream().map(this::mapAudioResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OpportunityAudioResponse getAudioSubmission(String id) {
        OpportunityAudio audio = opportunityAudioRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Audio submission not found"));
        return mapAudioResponse(audio);
    }

    @Override
    @Transactional
    public AdminOpportunityResponse createOpportunity(CreateOpportunityRequest request, String performedById, String performedByName) {
        Opportunity opportunity = mapToEntity(request);
        String statusStr = request.getStatus();
        if (statusStr == null || statusStr.isBlank()) {
            opportunity.setStatus(OpportunityStatus.DRAFT);
        } else {
            try {
                opportunity.setStatus(OpportunityStatus.valueOf(statusStr.toUpperCase()));
            } catch (IllegalArgumentException e) {
                opportunity.setStatus(OpportunityStatus.DRAFT);
            }
        }
        Opportunity saved = opportunityRepository.save(opportunity);
        auditService.logAction(AuditActionType.CREATED, "Opportunity", saved.getId() != null ? saved.getId().toString() : null, request.getTitle(), performedById, performedByName, "New opportunity created");
        if (saved.getStatus() == OpportunityStatus.PUBLISHED) {
            announcePublished(saved);
        }
        return mapToAdminResponse(saved);
    }

    @Override
    @Transactional
    public AdminOpportunityResponse publishFromAudio(String audioId, CreateOpportunityRequest request, String performedById, String performedByName) {
        OpportunityAudio audio = opportunityAudioRepository.findById(UUID.fromString(audioId))
                .orElseThrow(() -> new ResourceNotFoundException("Audio submission not found"));

        Opportunity opportunity = mapToEntity(request);
        opportunity.setStatus(OpportunityStatus.PUBLISHED);
        if (opportunity.getElder() == null && audio.getKnowledgeHolder() != null) {
            opportunity.setElder(audio.getKnowledgeHolder());
        }
        Opportunity saved = opportunityRepository.save(opportunity);
        auditService.logAction(AuditActionType.PUBLISHED, "Opportunity", saved.getId() != null ? saved.getId().toString() : null, request.getTitle(), performedById, performedByName, "Opportunity published from audio submission: " + audioId);
        announcePublished(saved);

        audio.setStatus(AudioReviewStatus.FULLY_LISTENED);
        opportunityAudioRepository.save(audio);

        // Sync status back to corresponding JobRequest if present
        try {
            if (audio.getAudioUrl() != null && !audio.getAudioUrl().isBlank()) {
                jobRequestRepository.findAll().stream()
                        .filter(jr -> audio.getAudioUrl().equals(jr.getVoiceNoteUrl()) || audio.getAudioUrl().contains(jr.getId().toString()))
                        .findFirst()
                        .ifPresent(jr -> {
                            jr.setStatus(JobRequestStatus.PUBLISHED);
                            jobRequestRepository.save(jr);
                            log.info("Updated JobRequest {} status to PUBLISHED", jr.getId());
                        });
            }
        } catch (Exception e) {
            log.warn("Could not sync published status back to JobRequest: {}", e.getMessage());
        }

        return mapToAdminResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminOpportunityResponse> getAllOpportunities(String statusFilter) {
        List<Opportunity> opportunities;
        if (statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)) {
            opportunities = opportunityRepository.findAll();
        } else {
            try {
                OpportunityStatus status = OpportunityStatus.valueOf(statusFilter.toUpperCase());
                opportunities = opportunityRepository.findByStatus(status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid OpportunityStatus filter '{}', returning all opportunities", statusFilter);
                opportunities = opportunityRepository.findAll();
            }
        }
        return opportunities.stream().map(this::mapToAdminResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminOpportunityResponse getOpportunity(String id) {
        Opportunity opportunity = opportunityRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
        return mapToAdminResponse(opportunity);
    }

    @Override
    @Transactional
    public AdminOpportunityResponse updateOpportunityStatus(String id, UpdateOpportunityStatusRequest request, String performedById, String performedByName) {
        Opportunity opportunity = opportunityRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
        OpportunityStatus before = opportunity.getStatus();
        opportunity.setStatus(OpportunityStatus.valueOf(request.getStatus().toUpperCase()));
        Opportunity saved = opportunityRepository.save(opportunity);
        if (before != OpportunityStatus.PUBLISHED && saved.getStatus() == OpportunityStatus.PUBLISHED) {
            announcePublished(saved);
        }
        auditService.logAction(AuditActionType.UPDATED, "Opportunity", id, saved.getTitle(), performedById, performedByName, "Status changed to: " + request.getStatus());
        return mapToAdminResponse(saved);
    }

    private Opportunity mapToEntity(CreateOpportunityRequest request) {
        Opportunity opportunity = new Opportunity();
        opportunity.setTitle(request.getTitle());
        opportunity.setDescription(request.getDescription());
        opportunity.setHeroImageUrl(request.getHeroImageUrl());
        opportunity.setLocation(request.getLocation());
        opportunity.setCategory(request.getCategory());
        opportunity.setLocationType(request.getLocationType());
        opportunity.setMatchPercentage(request.getMatchPercentage());
        opportunity.setUrgent(request.getUrgent() != null && request.getUrgent());
        opportunity.setDueAt(request.getDueAt());
        opportunity.setScheduledDate(request.getScheduledDate());
        opportunity.setDurationText(request.getDurationText());
        opportunity.setTimeWindowText(request.getTimeWindowText());
        opportunity.setLanguage(request.getLanguage());
        opportunity.setOfferedAmount(request.getOfferedAmount());
        opportunity.setPreservationGoal(request.getPreservationGoal());
        opportunity.setTasks(request.getTasks());
        opportunity.setRequiredSkills(request.getRequiredSkills());

        User elder = null;
        if (request.getElderId() != null) {
            elder = userRepository.findById(request.getElderId())
                    .orElse(null);
        } else if (request.getElderName() != null && !request.getElderName().isBlank()) {
            elder = userRepository.findByFullName(request.getElderName().trim())
                    .orElse(null);
        }
        opportunity.setElder(elder);

        return opportunity;
    }

    private OpportunityAudioResponse mapAudioResponse(OpportunityAudio audio) {
        return OpportunityAudioResponse.builder()
                .id(audio.getId() != null ? audio.getId().toString() : null)
                .elderName(audio.getElderName())
                .elderAvatarUrl(audio.getElderAvatarUrl())
                .verified(audio.isVerified())
                .location(audio.getLocation())
                .recordedAt(audio.getRecordedAt() != null ? audio.getRecordedAt().format(DATE_FORMATTER) : null)
                .duration(audio.getDuration())
                .audioUrl(audio.getAudioUrl())
                .topic(audio.getTopic())
                .tags(audio.getTags())
                .status(audio.getStatus() != null ? audio.getStatus().name() : null)
                .createdAt(audio.getCreatedAt() != null ? audio.getCreatedAt().format(DATE_FORMATTER) : null)
                .build();
    }

    private AdminOpportunityResponse mapToAdminResponse(Opportunity opportunity) {
        User elder = opportunity.getElder();
        return AdminOpportunityResponse.builder()
                .id(opportunity.getId())
                .title(opportunity.getTitle())
                .description(opportunity.getDescription())
                .heroImageUrl(opportunity.getHeroImageUrl())
                .location(opportunity.getLocation())
                .category(opportunity.getCategory())
                .locationType(opportunity.getLocationType())
                .matchPercentage(opportunity.getMatchPercentage())
                .urgent(opportunity.isUrgent())
                .dueAt(opportunity.getDueAt() != null ? opportunity.getDueAt().format(DATE_FORMATTER) : null)
                .scheduledDate(opportunity.getScheduledDate())
                .durationText(opportunity.getDurationText())
                .timeWindowText(opportunity.getTimeWindowText())
                .language(opportunity.getLanguage())
                .offeredAmount(opportunity.getOfferedAmount())
                .preservationGoal(opportunity.getPreservationGoal())
                .tasks(opportunity.getTasks())
                .status(opportunity.getStatus() != null ? opportunity.getStatus().name() : null)
                .elderId(elder != null && elder.getId() != null ? elder.getId().toString() : null)
                .elderName(elder != null ? elder.getFullName() : null)
                .createdAt(
                        opportunity.getCreatedAt() != null ? opportunity.getCreatedAt().format(DATE_FORMATTER) : null)
                .updatedAt(
                        opportunity.getUpdatedAt() != null ? opportunity.getUpdatedAt().format(DATE_FORMATTER) : null)
                .build();
    }
}
