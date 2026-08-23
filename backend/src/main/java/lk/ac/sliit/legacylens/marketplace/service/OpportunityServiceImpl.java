package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityCardResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityDetailResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.users.repository.KnowledgeHolderProfileRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Read-only for content creators. Nothing here writes an Opportunity — the
 * elder audio submission + admin transcription/publish flow is a separate,
 * not-yet-built feature (see Opportunity's javadoc).
 */
@Service
public class OpportunityServiceImpl implements OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;

    public OpportunityServiceImpl(
            OpportunityRepository opportunityRepository,
            KnowledgeHolderProfileRepository knowledgeHolderProfileRepository) {
        this.opportunityRepository = opportunityRepository;
        this.knowledgeHolderProfileRepository = knowledgeHolderProfileRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> getRecommended(int limit) {
        return opportunityRepository.findRecommended(OpportunityStatus.PUBLISHED, PageRequest.of(0, limit)).stream()
                .map(this::mapCard)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> getUrgent(int limit) {
        return opportunityRepository
                .findByStatusAndUrgentTrueOrderByDueAtAsc(OpportunityStatus.PUBLISHED, PageRequest.of(0, limit))
                .stream()
                .map(this::mapCard)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> getRecent(int limit) {
        return opportunityRepository
                .findByStatusOrderByCreatedAtDesc(OpportunityStatus.PUBLISHED, PageRequest.of(0, limit))
                .stream()
                .map(this::mapCard)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OpportunityDetailResponse getById(UUID id) {
        Opportunity opportunity = opportunityRepository.findByIdAndStatus(id, OpportunityStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));

        boolean elderVerified = knowledgeHolderProfileRepository
                .findByUserId(opportunity.getElder().getId())
                .isPresent();

        List<String> tasks = opportunity.getTasks() == null || opportunity.getTasks().isBlank()
                ? List.of()
                : Arrays.stream(opportunity.getTasks().split("\n"))
                        .map(String::trim)
                        .filter(line -> !line.isEmpty())
                        .collect(Collectors.toList());

        return OpportunityDetailResponse.builder()
                .id(opportunity.getId())
                .title(opportunity.getTitle())
                .description(opportunity.getDescription())
                .heroImageUrl(opportunity.getHeroImageUrl())
                .elderName(opportunity.getElder().getFullName())
                .elderAvatarUrl(opportunity.getElder().getProfilePhotoUrl())
                .elderVerified(elderVerified)
                .location(opportunity.getLocation())
                .scheduledDate(opportunity.getScheduledDate())
                .durationText(opportunity.getDurationText())
                .offeredAmount(opportunity.getOfferedAmount())
                .timeWindowText(opportunity.getTimeWindowText())
                .preservationGoal(opportunity.getPreservationGoal())
                .tasks(tasks)
                .build();
    }

    private OpportunityCardResponse mapCard(Opportunity opportunity) {
        return OpportunityCardResponse.builder()
                .id(opportunity.getId())
                .title(opportunity.getTitle())
                .description(opportunity.getDescription())
                .heroImageUrl(opportunity.getHeroImageUrl())
                .location(opportunity.getLocation())
                .category(opportunity.getCategory())
                .locationType(opportunity.getLocationType())
                .matchPercentage(opportunity.getMatchPercentage())
                .urgent(opportunity.isUrgent())
                .dueAt(opportunity.getDueAt())
                .elderName(opportunity.getElder().getFullName())
                .elderAvatarUrl(opportunity.getElder().getProfilePhotoUrl())
                .elderLocation(opportunity.getElder().getCity() != null ? opportunity.getElder().getCity().getName() : null)
                .createdAt(opportunity.getCreatedAt())
                .build();
    }
}
