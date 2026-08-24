package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityCardResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityDetailResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import lk.ac.sliit.legacylens.users.repository.KnowledgeHolderProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(OpportunityServiceImpl.class);

    /** Shown whenever a personalised score can't be computed (no creator, no profile, or any error). */
    private static final int DEFAULT_MATCH_PERCENTAGE = 60;

    private final OpportunityRepository opportunityRepository;
    private final KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;
    private final CreatorProfileRepository creatorProfileRepository;
    private final UserRepository userRepository;

    public OpportunityServiceImpl(
            OpportunityRepository opportunityRepository,
            KnowledgeHolderProfileRepository knowledgeHolderProfileRepository,
            CreatorProfileRepository creatorProfileRepository,
            UserRepository userRepository) {
        this.opportunityRepository = opportunityRepository;
        this.knowledgeHolderProfileRepository = knowledgeHolderProfileRepository;
        this.creatorProfileRepository = creatorProfileRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> getRecommended(int limit, UUID creatorId) {
        User creator = loadCreator(creatorId);
        return opportunityRepository.findRecommended(OpportunityStatus.PUBLISHED, PageRequest.of(0, limit)).stream()
                .map(o -> mapCard(o, creator))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> getUrgent(int limit, UUID creatorId) {
        User creator = loadCreator(creatorId);
        return opportunityRepository
                .findByStatusAndUrgentTrueOrderByDueAtAsc(OpportunityStatus.PUBLISHED, PageRequest.of(0, limit))
                .stream()
                .map(o -> mapCard(o, creator))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> getRecent(int limit, UUID creatorId) {
        User creator = loadCreator(creatorId);
        return opportunityRepository
                .findByStatusOrderByCreatedAtDesc(OpportunityStatus.PUBLISHED, PageRequest.of(0, limit))
                .stream()
                .map(o -> mapCard(o, creator))
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

    private OpportunityCardResponse mapCard(Opportunity opportunity, User creator) {
        return OpportunityCardResponse.builder()
                .id(opportunity.getId())
                .title(opportunity.getTitle())
                .description(opportunity.getDescription())
                .heroImageUrl(opportunity.getHeroImageUrl())
                .location(opportunity.getLocation())
                .category(opportunity.getCategory())
                .locationType(opportunity.getLocationType())
                .matchPercentage(computeMatchPercentage(creator, opportunity))
                .urgent(opportunity.isUrgent())
                .dueAt(opportunity.getDueAt())
                .elderName(opportunity.getElder().getFullName())
                .elderAvatarUrl(opportunity.getElder().getProfilePhotoUrl())
                .elderLocation(opportunity.getElder().getCity() != null ? opportunity.getElder().getCity().getName() : null)
                .createdAt(opportunity.getCreatedAt())
                .build();
    }

    /** Loads the logged-in creator for personalising match scores; null (and never an exception) if unavailable. */
    private User loadCreator(UUID creatorId) {
        if (creatorId == null) {
            return null;
        }
        try {
            return userRepository.findById(creatorId).orElse(null);
        } catch (Exception e) {
            log.warn("Could not load creator {} for opportunity matching, using default score instead", creatorId, e);
            return null;
        }
    }

    /**
     * A simple, explainable relevance score: how well this opportunity fits the
     * creator, based on two signals — do their listed skills/interests mention
     * this opportunity's category, and is the opportunity near their city.
     * Deliberately not a machine-learned recommender (no interaction history
     * exists yet to train one) — just a small weighted heuristic that always
     * returns a sensible number, even when profile data is missing.
     */
    private int computeMatchPercentage(User creator, Opportunity opportunity) {
        try {
            if (creator == null) {
                return DEFAULT_MATCH_PERCENTAGE;
            }

            int score = 45; // baseline so every opportunity still looks reasonably relevant

            String category = opportunity.getCategory();
            if (category != null && !category.isBlank()) {
                CreatorProfile profile = creatorProfileRepository.findByUserId(creator.getId()).orElse(null);
                if (profile != null) {
                    String keywords = ((profile.getSkills() != null ? profile.getSkills() : "") + ","
                            + (profile.getInterests() != null ? profile.getInterests() : "")).toLowerCase();
                    if (!keywords.isBlank() && keywords.contains(category.toLowerCase())) {
                        score += 35;
                    }
                }
            }

            String creatorCity = creator.getCity() != null ? creator.getCity().getName() : null;
            String opportunityLocation = opportunity.getLocation();
            if (creatorCity != null && !creatorCity.isBlank()
                    && opportunityLocation != null
                    && opportunityLocation.toLowerCase().contains(creatorCity.toLowerCase())) {
                score += 20;
            }

            return Math.max(40, Math.min(96, score));
        } catch (Exception e) {
            log.warn("Match percentage calculation failed, falling back to default", e);
            return DEFAULT_MATCH_PERCENTAGE;
        }
    }
}
