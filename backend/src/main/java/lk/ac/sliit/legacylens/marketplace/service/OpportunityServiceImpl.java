package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityCardResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityDetailResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.Match;
import lk.ac.sliit.legacylens.marketplace.service.OpportunityMatcher.CreatorMatching;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.KnowledgeHolderProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Read-only for content creators. Nothing here writes an Opportunity - the
 * elder audio submission + admin transcription/publish flow is a separate
 * feature (see Opportunity's javadoc).
 *
 * Every match percentage is worked out by the creator -> opportunity algorithm
 * (see {@link CreatorMatchScorer}); it is never made up. A user who is not a
 * creator simply gets no percentage.
 */
@Service
public class OpportunityServiceImpl implements OpportunityService {

    /** How many published opportunities are looked at when picking recommendations. */
    private static final int RECOMMENDATION_POOL = 500;

    private final OpportunityRepository opportunityRepository;
    private final KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;
    private final UserRepository userRepository;
    private final OpportunityMatcher matcher;

    public OpportunityServiceImpl(
            OpportunityRepository opportunityRepository,
            KnowledgeHolderProfileRepository knowledgeHolderProfileRepository,
            UserRepository userRepository,
            OpportunityMatcher matcher) {
        this.opportunityRepository = opportunityRepository;
        this.knowledgeHolderProfileRepository = knowledgeHolderProfileRepository;
        this.userRepository = userRepository;
        this.matcher = matcher;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> getRecommended(int limit, UUID creatorId) {
        CreatorMatching matching = matcher.forCreator(creatorId);
        if (!matching.isCreator()) {
            return List.of();
        }

        // 1. Eligibility - leave out whatever cannot realistically be taken.
        // 2. Score the rest and keep the ones worth recommending.
        // 3. Rank by score, best first.
        return opportunityRepository
                .findByStatusOrderByCreatedAtDesc(OpportunityStatus.PUBLISHED, PageRequest.of(0, RECOMMENDATION_POOL))
                .stream()
                .filter(matching::isEligible)
                .map(opportunity -> new Scored(opportunity, matching.score(opportunity)))
                .filter(scored -> scored.match().recommendableToCreator())
                .sorted(Comparator.comparingInt((Scored scored) -> scored.match().percentage()).reversed()
                        .thenComparing(scored -> scored.opportunity().getCreatedAt(),
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(limit)
                .map(scored -> mapCard(scored.opportunity(), scored.match()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> getUrgent(int limit, UUID creatorId) {
        CreatorMatching matching = matcher.forCreator(creatorId);
        return opportunityRepository
                .findByStatusAndUrgentTrueOrderByDueAtAsc(OpportunityStatus.PUBLISHED, PageRequest.of(0, limit))
                .stream()
                .map(o -> mapCard(o, matching.score(o)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> getRecent(int limit, UUID creatorId) {
        CreatorMatching matching = matcher.forCreator(creatorId);
        return opportunityRepository
                .findByStatusOrderByCreatedAtDesc(OpportunityStatus.PUBLISHED, PageRequest.of(0, limit))
                .stream()
                .map(o -> mapCard(o, matching.score(o)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> search(int limit, UUID creatorId, String category, boolean nearby) {
        User creator = creatorId == null ? null : userRepository.findById(creatorId).orElse(null);

        String location = null;
        if (nearby) {
            if (creator == null || creator.getCity() == null) {
                return List.of();
            }
            location = creator.getCity().getName();
        }

        CreatorMatching matching = matcher.forCreator(creatorId);
        return opportunityRepository
                .search(OpportunityStatus.PUBLISHED, category, location, PageRequest.of(0, limit))
                .stream()
                .map(o -> mapCard(o, matching.score(o)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OpportunityDetailResponse getById(UUID id, UUID creatorId) {
        Opportunity opportunity = opportunityRepository.findByIdAndStatus(id, OpportunityStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));

        User elder = opportunity.getElder();
        boolean elderVerified = elder != null && knowledgeHolderProfileRepository
                .findByUserId(elder.getId())
                .isPresent();

        List<String> tasks = opportunity.getTasks() == null || opportunity.getTasks().isBlank()
                ? List.of()
                : Arrays.stream(opportunity.getTasks().split("\n"))
                        .map(String::trim)
                        .filter(line -> !line.isEmpty())
                        .collect(Collectors.toList());

        Match match = matcher.forCreator(creatorId).score(opportunity);

        return OpportunityDetailResponse.builder()
                .id(opportunity.getId())
                .title(opportunity.getTitle())
                .description(opportunity.getDescription())
                .heroImageUrl(opportunity.getHeroImageUrl())
                .elderName(elder != null ? elder.getFullName() : null)
                .elderAvatarUrl(elder != null ? elder.getProfilePhotoUrl() : null)
                .elderVerified(elderVerified)
                .location(opportunity.getLocation())
                .scheduledDate(opportunity.getScheduledDate())
                .durationText(opportunity.getDurationText())
                .offeredAmount(opportunity.getOfferedAmount())
                .timeWindowText(opportunity.getTimeWindowText())
                .language(opportunity.getLanguage())
                .preservationGoal(opportunity.getPreservationGoal())
                .tasks(tasks)
                .matchPercentage(match == null ? null : match.percentage())
                .matchLevel(match == null ? null : match.level().name())
                .matchReasons(match == null ? null : match.reasons())
                .build();
    }

    private OpportunityCardResponse mapCard(Opportunity opportunity, Match match) {
        User elder = opportunity.getElder();
        return OpportunityCardResponse.builder()
                .id(opportunity.getId())
                .title(opportunity.getTitle())
                .description(opportunity.getDescription())
                .heroImageUrl(opportunity.getHeroImageUrl())
                .location(opportunity.getLocation())
                .category(opportunity.getCategory())
                .locationType(opportunity.getLocationType())
                .matchPercentage(match == null ? null : match.percentage())
                .matchLevel(match == null ? null : match.level().name())
                .matchReasons(match == null ? null : match.reasons())
                .urgent(opportunity.isUrgent())
                .dueAt(opportunity.getDueAt())
                .elderName(elder != null ? elder.getFullName() : null)
                .elderAvatarUrl(elder != null ? elder.getProfilePhotoUrl() : null)
                .elderLocation(elder != null && elder.getCity() != null ? elder.getCity().getName() : null)
                .createdAt(opportunity.getCreatedAt())
                .build();
    }

    private record Scored(Opportunity opportunity, Match match) {
    }
}
