package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminOpportunityResponse;
import lk.ac.sliit.legacylens.admin.dto.CreateOpportunityRequest;
import lk.ac.sliit.legacylens.admin.dto.OpportunityAudioResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateOpportunityStatusRequest;
import lk.ac.sliit.legacylens.admin.entity.AudioReviewStatus;
import lk.ac.sliit.legacylens.admin.entity.OpportunityAudio;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.admin.repository.OpportunityAudioRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminOpportunityServiceImpl implements AdminOpportunityService {

    private static final Logger log = LoggerFactory.getLogger(AdminOpportunityServiceImpl.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final OpportunityAudioRepository opportunityAudioRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;

    public AdminOpportunityServiceImpl(
            OpportunityAudioRepository opportunityAudioRepository,
            OpportunityRepository opportunityRepository,
            UserRepository userRepository) {
        this.opportunityAudioRepository = opportunityAudioRepository;
        this.opportunityRepository = opportunityRepository;
        this.userRepository = userRepository;
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
    public AdminOpportunityResponse createOpportunity(CreateOpportunityRequest request) {
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
        return mapToAdminResponse(saved);
    }

    @Override
    @Transactional
    public AdminOpportunityResponse publishFromAudio(String audioId, CreateOpportunityRequest request) {
        OpportunityAudio audio = opportunityAudioRepository.findById(UUID.fromString(audioId))
                .orElseThrow(() -> new ResourceNotFoundException("Audio submission not found"));

        Opportunity opportunity = mapToEntity(request);
        opportunity.setStatus(OpportunityStatus.PUBLISHED);
        Opportunity saved = opportunityRepository.save(opportunity);

        audio.setStatus(AudioReviewStatus.FULLY_LISTENED);
        opportunityAudioRepository.save(audio);

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
    public AdminOpportunityResponse updateOpportunityStatus(String id, UpdateOpportunityStatusRequest request) {
        Opportunity opportunity = opportunityRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
        opportunity.setStatus(OpportunityStatus.valueOf(request.getStatus().toUpperCase()));
        Opportunity saved = opportunityRepository.save(opportunity);
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
