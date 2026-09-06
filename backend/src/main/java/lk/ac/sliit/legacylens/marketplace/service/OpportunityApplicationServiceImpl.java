package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationRequest;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Owns the "apply to an opportunity" lifecycle: saving/editing a draft,
 * listing a creator's own applications, submitting, and deleting. There is
 * no approval step here yet — a knowledge holder/admin review UI for these
 * applications is a separate, not-yet-built feature (same gap noted on
 * Opportunity and Job), so PENDING is the terminal state for now.
 */
@Service
public class OpportunityApplicationServiceImpl implements OpportunityApplicationService {

    private final OpportunityApplicationRepository opportunityApplicationRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;

    public OpportunityApplicationServiceImpl(
            OpportunityApplicationRepository opportunityApplicationRepository,
            OpportunityRepository opportunityRepository,
            UserRepository userRepository) {
        this.opportunityApplicationRepository = opportunityApplicationRepository;
        this.opportunityRepository = opportunityRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OpportunityApplicationResponse saveDraft(UUID creatorId, OpportunityApplicationRequest request) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Opportunity opportunity = opportunityRepository
                .findByIdAndStatus(request.getOpportunityId(), OpportunityStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));

        OpportunityApplication application = opportunityApplicationRepository
                .findByCreatorIdAndOpportunityId(creatorId, request.getOpportunityId())
                .orElseGet(OpportunityApplication::new);

        if (application.getId() != null && application.getStatus() != OpportunityApplicationStatus.SAVED) {
            throw new InvalidApplicationStateException(
                    "This application has already been submitted and can no longer be edited.");
        }

        application.setCreator(creator);
        application.setOpportunity(opportunity);
        application.setSkills(joinOrEmpty(request.getSkills()));
        application.setExperienceText(request.getExperienceText());
        application.setApproachText(request.getApproachText());
        application.setAvailabilityConfirmed(request.isAvailabilityConfirmed());
        application.setEquipment(joinOrEmpty(request.getEquipment()));
        application.setStatus(OpportunityApplicationStatus.SAVED);

        OpportunityApplication saved = opportunityApplicationRepository.save(application);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityApplicationResponse> getMyApplications(UUID creatorId) {
        return opportunityApplicationRepository.findByCreatorIdOrderBySavedAtDesc(creatorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<OpportunityApplicationResponse> getByOpportunity(UUID creatorId, UUID opportunityId) {
        return opportunityApplicationRepository.findByCreatorIdAndOpportunityId(creatorId, opportunityId)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public OpportunityApplicationResponse submitApplication(UUID creatorId, UUID applicationId) {
        OpportunityApplication application = opportunityApplicationRepository
                .findByIdAndCreatorId(applicationId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (application.getStatus() != OpportunityApplicationStatus.SAVED) {
            throw new InvalidApplicationStateException("Only a saved draft can be submitted.");
        }

        application.setStatus(OpportunityApplicationStatus.PENDING);
        application.setSubmittedAt(LocalDateTime.now());

        return mapToResponse(opportunityApplicationRepository.save(application));
    }

    @Override
    @Transactional
    public void deleteApplication(UUID creatorId, UUID applicationId) {
        OpportunityApplication application = opportunityApplicationRepository
                .findByIdAndCreatorId(applicationId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        opportunityApplicationRepository.delete(application);
    }

    private OpportunityApplicationResponse mapToResponse(OpportunityApplication application) {
        Opportunity opportunity = application.getOpportunity();

        return OpportunityApplicationResponse.builder()
                .id(application.getId())
                .opportunityId(opportunity.getId())
                .title(opportunity.getTitle())
                .elderName(opportunity.getElder().getFullName())
                .location(opportunity.getLocation())
                .heroImageUrl(opportunity.getHeroImageUrl())
                .scheduledDate(opportunity.getScheduledDate())
                .timeWindowText(opportunity.getTimeWindowText())
                .offeredAmount(opportunity.getOfferedAmount())
                .skills(splitCsv(application.getSkills()))
                .experienceText(application.getExperienceText())
                .approachText(application.getApproachText())
                .availabilityConfirmed(application.isAvailabilityConfirmed())
                .equipment(splitCsv(application.getEquipment()))
                .status(application.getStatus().name())
                .savedAt(application.getSavedAt())
                .submittedAt(application.getSubmittedAt())
                .build();
    }

    private static List<String> splitCsv(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private static String joinOrEmpty(List<String> items) {
        return items == null ? "" : String.join(", ", items);
    }
}
