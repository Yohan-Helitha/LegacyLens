package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityBrowseResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityCardResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityDetailResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.matching.CreatorMatchScorer.Match;
import lk.ac.sliit.legacylens.marketplace.matching.OpportunityMatcher;
import lk.ac.sliit.legacylens.marketplace.matching.OpportunityMatcher.CreatorMatching;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.KnowledgeHolderProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
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

    private static final Logger log = LoggerFactory.getLogger(OpportunityServiceImpl.class);

    /**
     * How many published opportunities are looked at when picking recommendations. Scoring happens
     * in memory, so this keeps one request bounded; a warning is logged whenever it is reached.
     */
    private static final int RECOMMENDATION_POOL = 500;

    private final OpportunityRepository opportunityRepository;
    private final KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;
    private final UserRepository userRepository;
    private final OpportunityMatcher matcher;
    private final OpportunityApplicationRepository applicationRepository;

    public OpportunityServiceImpl(
            OpportunityRepository opportunityRepository,
            KnowledgeHolderProfileRepository knowledgeHolderProfileRepository,
            UserRepository userRepository,
            OpportunityMatcher matcher,
            OpportunityApplicationRepository applicationRepository) {
        this.opportunityRepository = opportunityRepository;
        this.knowledgeHolderProfileRepository = knowledgeHolderProfileRepository;
        this.userRepository = userRepository;
        this.matcher = matcher;
        this.applicationRepository = applicationRepository;
    }

    /**
     * The opportunities this creator has already applied for. A saved draft is not an application yet,
     * so it stays listed; a sent one - whatever the answer - is left out so the creator only browses
     * what is still open to them. Other creators are not affected.
     */
    private Set<UUID> alreadyAppliedTo(UUID creatorId) {
        if (creatorId == null) {
            return Set.of();
        }
        return applicationRepository.findByCreatorIdOrderBySavedAtDesc(creatorId).stream()
                .filter(application -> application.getStatus() != OpportunityApplicationStatus.SAVED)
                .map(application -> application.getOpportunity().getId())
                .collect(Collectors.toSet());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> getRecommended(int limit, UUID creatorId) {
        return recommended(limit, creatorId, matcher.forCreator(creatorId), alreadyAppliedTo(creatorId));
    }

    @Override
    @Transactional(readOnly = true)
    public OpportunityBrowseResponse browse(UUID creatorId) {
        // Worked out once for the whole page - the three lists used to each repeat it in their own request.
        CreatorMatching matching = matcher.forCreator(creatorId);
        Set<UUID> applied = alreadyAppliedTo(creatorId);
        List<OpportunityCardResponse> recommended = recommended(1, creatorId, matching, applied);
        List<OpportunityCardResponse> urgent = urgent(1, matching, applied);
        // A job already shown as Recommended or Urgent is not listed a second time under Recent Postings.
        Set<UUID> alreadyShown = new java.util.HashSet<>(applied);
        recommended.forEach(card -> alreadyShown.add(card.getId()));
        urgent.forEach(card -> alreadyShown.add(card.getId()));
        List<OpportunityCardResponse> recent = recent(10, matching, alreadyShown);
        return OpportunityBrowseResponse.builder()
                .recommended(recommended)
                .urgent(urgent)
                .recent(recent)
                .build();
    }

    private List<OpportunityCardResponse> recommended(int limit, UUID creatorId, CreatorMatching matching, Set<UUID> applied) {
        if (!matching.isCreator()) {
            return List.of();
        }

        // 1. Eligibility - leave out whatever cannot realistically be taken.
        // 2. Score the rest and keep the ones worth recommending.
        // 3. Rank by score, best first.
        List<Opportunity> pool = opportunityRepository
                .findByStatusOrderByCreatedAtDesc(OpportunityStatus.PUBLISHED, PageRequest.of(0, RECOMMENDATION_POOL));
        if (pool.size() >= RECOMMENDATION_POOL) {
            log.warn("Recommendations only looked at the newest {} published opportunities; older ones were not considered",
                    RECOMMENDATION_POOL);
        }
        return cards(pool.stream()
                .filter(opportunity -> !applied.contains(opportunity.getId()))
                .filter(matching::isEligible)
                .map(opportunity -> new Scored(opportunity, matching.score(opportunity)))
                .filter(scored -> scored.match().recommendableToCreator())
                .sorted(Comparator.comparingInt((Scored scored) -> scored.match().percentage()).reversed()
                        .thenComparing(scored -> scored.opportunity().getCreatedAt(),
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(limit)
                .collect(Collectors.toList()));
    }

    private List<OpportunityCardResponse> cards(List<Scored> scored) {
        return scored.stream()
                .map(s -> mapCard(s.opportunity(), s.match()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> getUrgent(int limit, UUID creatorId) {
        return urgent(limit, matcher.forCreator(creatorId), alreadyAppliedTo(creatorId));
    }

    private List<OpportunityCardResponse> urgent(int limit, CreatorMatching matching, Set<UUID> applied) {
        return cards(opportunityRepository
                .findByStatusAndUrgentTrueOrderByDueAtAsc(OpportunityStatus.PUBLISHED, PageRequest.of(0, limit + applied.size()))
                .stream()
                .filter(o -> !applied.contains(o.getId()))
                .limit(limit)
                .map(o -> new Scored(o, matching.score(o)))
                .collect(Collectors.toList()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> getRecent(int limit, UUID creatorId) {
        return recent(limit, matcher.forCreator(creatorId), alreadyAppliedTo(creatorId));
    }

    private List<OpportunityCardResponse> recent(int limit, CreatorMatching matching, Set<UUID> applied) {
        return cards(opportunityRepository
                .findByStatusOrderByCreatedAtDesc(OpportunityStatus.PUBLISHED, PageRequest.of(0, limit + applied.size()))
                .stream()
                .filter(o -> !applied.contains(o.getId()))
                .limit(limit)
                .map(o -> new Scored(o, matching.score(o)))
                .collect(Collectors.toList()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityCardResponse> search(int limit, UUID creatorId, String category, boolean nearby, String text) {
        User creator = creatorId == null ? null : userRepository.findById(creatorId).orElse(null);

        // "" means the filter is not in effect - see OpportunityRepository.search for why it is never null.
        String location = "";
        if (nearby) {
            if (creator == null || creator.getCity() == null) {
                return List.of();
            }
            location = creator.getCity().getName();
        }

        CreatorMatching matching = matcher.forCreator(creatorId);
        Set<UUID> applied = alreadyAppliedTo(creatorId);
        return cards(opportunityRepository
                .search(OpportunityStatus.PUBLISHED, category == null || category.isBlank() ? "" : category.trim(), location,
                        text == null || text.isBlank() ? "" : text.trim(),
                        PageRequest.of(0, limit + applied.size()))
                .stream()
                .filter(o -> !applied.contains(o.getId()))
                .limit(limit)
                .map(o -> new Scored(o, matching.score(o)))
                .collect(Collectors.toList()));
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
                .category(opportunity.getCategory())
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
