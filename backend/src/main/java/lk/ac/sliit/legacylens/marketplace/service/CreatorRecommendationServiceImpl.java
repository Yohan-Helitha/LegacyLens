package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityRecommendationsResponse;
import lk.ac.sliit.legacylens.marketplace.dto.RecommendationOpportunitySummaryResponse;
import lk.ac.sliit.legacylens.marketplace.dto.RecommendedCreatorResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorInvitationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityCreatorInvitation;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityCreatorInvitationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.CreatorCandidate;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.Match;
import lk.ac.sliit.legacylens.messaging.service.MessagingService;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.entity.City;
import lk.ac.sliit.legacylens.users.repository.CityRepository;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CreatorRecommendationServiceImpl implements CreatorRecommendationService {

    /** How many matches are listed under "Other good matches" per opportunity, after the best match. */
    static final int MAX_OTHERS = 4;

    /** How many recommendations are listed when no creator is strong enough to be the best match. */
    static final int MAX_RECOMMENDATIONS_WITHOUT_BEST = 5;

    /** Application statuses that mean this creator has already been picked for the opportunity. */
    private static final Set<OpportunityApplicationStatus> CHOSEN_APPLICATION_STATUSES =
            Set.of(OpportunityApplicationStatus.APPROVED, OpportunityApplicationStatus.BOOKED);

    /** Highest score first; ties go to the better-rated, then more experienced, then alphabetical creator. */
    private static final Comparator<Match> RANKING = Comparator
            .comparingInt(Match::percentage).reversed()
            .thenComparing(match -> match.candidate().rating(), Comparator.nullsLast(Comparator.<BigDecimal>reverseOrder()))
            .thenComparing(match -> match.candidate().completedJobs(), Comparator.reverseOrder())
            .thenComparing(match -> match.candidate().user().getFullName(), Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));

    private final OpportunityRepository opportunityRepository;
    private final OpportunityApplicationRepository opportunityApplicationRepository;
    private final OpportunityCreatorInvitationRepository invitationRepository;
    private final CreatorProfileRepository creatorProfileRepository;
    private final CreatorApplicationRepository creatorApplicationRepository;
    private final JobRepository jobRepository;
    private final CityRepository cityRepository;
    private final MessagingService messagingService;

    public CreatorRecommendationServiceImpl(
            OpportunityRepository opportunityRepository,
            OpportunityApplicationRepository opportunityApplicationRepository,
            OpportunityCreatorInvitationRepository invitationRepository,
            CreatorProfileRepository creatorProfileRepository,
            CreatorApplicationRepository creatorApplicationRepository,
            JobRepository jobRepository,
            CityRepository cityRepository,
            MessagingService messagingService) {

        this.opportunityRepository = opportunityRepository;
        this.opportunityApplicationRepository = opportunityApplicationRepository;
        this.invitationRepository = invitationRepository;
        this.creatorProfileRepository = creatorProfileRepository;
        this.creatorApplicationRepository = creatorApplicationRepository;
        this.jobRepository = jobRepository;
        this.cityRepository = cityRepository;
        this.messagingService = messagingService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpportunityRecommendationsResponse> getMyRecommendations(UUID elderId) {
        List<Opportunity> opportunities =
                opportunityRepository.findByElderIdAndStatusOrderByCreatedAtDesc(elderId, OpportunityStatus.PUBLISHED);
        if (opportunities.isEmpty()) {
            return List.of();
        }

        // Everything below is loaded once and reused for every opportunity.
        List<CreatorCandidate> candidates = loadCandidates(elderId);
        Map<UUID, CreatorCandidate> candidatesById = candidates.stream()
                .collect(Collectors.toMap(candidate -> candidate.user().getId(), Function.identity()));

        List<UUID> opportunityIds = opportunities.stream().map(Opportunity::getId).toList();
        Map<UUID, List<OpportunityApplication>> applicationsByOpportunity = opportunityApplicationRepository
                .findByOpportunityIdIn(opportunityIds).stream()
                .collect(Collectors.groupingBy(application -> application.getOpportunity().getId()));
        Map<UUID, List<OpportunityCreatorInvitation>> invitationsByOpportunity = invitationRepository
                .findByOpportunityIdIn(opportunityIds).stream()
                .collect(Collectors.groupingBy(invitation -> invitation.getOpportunity().getId()));
        List<City> cities = cityRepository.findAll();

        return opportunities.stream()
                .map(opportunity -> buildSection(
                        opportunity,
                        CreatorMatchScorer.analyse(opportunity, cities),
                        candidates,
                        candidatesById,
                        applicationsByOpportunity.getOrDefault(opportunity.getId(), List.of()),
                        invitationsByOpportunity.getOrDefault(opportunity.getId(), List.of())))
                .toList();
    }

    @Override
    @Transactional
    public void chooseCreator(UUID elderId, UUID opportunityId, UUID creatorId) {
        // Someone else's opportunity is reported as "not found" rather than "forbidden" so ids can't be probed.
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .filter(o -> o.getElder() != null && o.getElder().getId().equals(elderId))
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));

        if (opportunity.getStatus() != OpportunityStatus.PUBLISHED) {
            throw new InvalidApplicationStateException("This opportunity is no longer open.");
        }

        List<OpportunityApplication> applications = opportunityApplicationRepository.findByOpportunityId(opportunityId);
        UUID alreadyChosen = chosenCreatorId(applications, invitationRepository.findByOpportunityId(opportunityId));
        if (alreadyChosen != null) {
            if (alreadyChosen.equals(creatorId)) {
                return; // same choice again (e.g. a retried tap) — nothing to do
            }
            throw new InvalidApplicationStateException("You have already chosen a creator for this opportunity.");
        }

        CreatorProfile profile = creatorProfileRepository.findByUserId(creatorId)
                .filter(p -> p.getVerificationStatus() == VerificationStatus.VERIFIED)
                .filter(p -> p.getUser().getAccountStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Creator not found"));

        OpportunityApplication existing = applications.stream()
                .filter(application -> application.getCreator().getId().equals(creatorId))
                .findFirst()
                .orElse(null);

        if (existing != null && existing.getStatus() == OpportunityApplicationStatus.PENDING) {
            // The creator already applied — the elder choosing them IS the approval
            // (replaces the creator's temporary self-approve for this path). They then
            // book it from their dashboard exactly as before.
            existing.setStatus(OpportunityApplicationStatus.APPROVED);
            opportunityApplicationRepository.save(existing);
            messagingService.openConversation(elderId, creatorId, opportunityId);
            return;
        }

        OpportunityCreatorInvitation invitation = new OpportunityCreatorInvitation();
        invitation.setOpportunity(opportunity);
        invitation.setCreator(profile.getUser());
        invitation.setStatus(CreatorInvitationStatus.INVITED);
        invitationRepository.save(invitation);

        // Choosing someone opens a chat with them straight away, so the elder can say hello.
        messagingService.openConversation(elderId, creatorId, opportunityId);
    }

    /** Verified, active creators (never the elder themselves) with everything scoring needs. */
    private List<CreatorCandidate> loadCandidates(UUID elderId) {
        List<CreatorProfile> profiles = creatorProfileRepository.findByVerificationStatus(VerificationStatus.VERIFIED)
                .stream()
                .filter(profile -> profile.getUser().getAccountStatus() == AccountStatus.ACTIVE)
                .filter(profile -> !profile.getUser().getId().equals(elderId))
                .toList();
        if (profiles.isEmpty()) {
            return List.of();
        }

        List<UUID> userIds = profiles.stream().map(profile -> profile.getUser().getId()).toList();
        Map<UUID, CreatorApplication> applicationsByUser = creatorApplicationRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(application -> application.getUser().getId(), Function.identity(), (a, b) -> a));

        Map<UUID, Long> completedJobs = new HashMap<>();
        for (Object[] row : jobRepository.countByStatusGroupedByCreator(JobStatus.COMPLETED)) {
            completedJobs.put((UUID) row[0], ((Number) row[1]).longValue());
        }

        return profiles.stream()
                .map(profile -> {
                    UUID userId = profile.getUser().getId();
                    return new CreatorCandidate(
                            profile.getUser(),
                            profile,
                            applicationsByUser.get(userId),
                            completedJobs.getOrDefault(userId, 0L));
                })
                .toList();
    }

    private OpportunityRecommendationsResponse buildSection(
            Opportunity opportunity,
            CreatorMatchScorer.OpportunityNeeds needs,
            List<CreatorCandidate> candidates,
            Map<UUID, CreatorCandidate> candidatesById,
            List<OpportunityApplication> applications,
            List<OpportunityCreatorInvitation> invitations) {

        // Only a submitted application counts as "applied" — a SAVED draft is invisible to the elder.
        Set<UUID> appliedCreatorIds = applications.stream()
                .filter(application -> application.getStatus() != OpportunityApplicationStatus.SAVED
                        && application.getStatus() != OpportunityApplicationStatus.REJECTED)
                .map(application -> application.getCreator().getId())
                .collect(Collectors.toSet());

        // Creators who can't do any task this opportunity needs, or fall below the
        // recommendation bar, are dropped here — never shown just to fill the page.
        List<Match> ranked = candidates.stream()
                .map(candidate -> CreatorMatchScorer.score(
                        needs, opportunity, candidate, appliedCreatorIds.contains(candidate.user().getId())))
                .filter(Match::recommendable)
                .sorted(RANKING)
                .toList();

        // The top creator is only the "Best match" if they clear the higher bar. If
        // they don't, there is no best match — everyone is shown as a recommendation.
        boolean hasBestMatch = !ranked.isEmpty() && ranked.get(0).bestMatchWorthy();
        RecommendedCreatorResponse bestMatch = hasBestMatch ? toResponse(ranked.get(0)) : null;
        List<RecommendedCreatorResponse> others = ranked.stream()
                .skip(hasBestMatch ? 1 : 0)
                .limit(hasBestMatch ? MAX_OTHERS : MAX_RECOMMENDATIONS_WITHOUT_BEST)
                .map(this::toResponse)
                .toList();

        return OpportunityRecommendationsResponse.builder()
                .opportunity(toSummary(opportunity))
                .bestMatch(bestMatch)
                .others(others)
                .chosenCreator(resolveChosenCreator(applications, invitations, candidatesById, ranked))
                .build();
    }

    /**
     * The creator already picked for this opportunity — an approved/booked
     * application first (it's the stronger commitment), then an open
     * invitation. Null while nobody has been chosen.
     */
    static UUID chosenCreatorId(List<OpportunityApplication> applications, List<OpportunityCreatorInvitation> invitations) {
        return applications.stream()
                .filter(application -> CHOSEN_APPLICATION_STATUSES.contains(application.getStatus()))
                .map(application -> application.getCreator().getId())
                .findFirst()
                .or(() -> invitations.stream()
                        .filter(invitation -> invitation.getStatus() != CreatorInvitationStatus.DECLINED)
                        .map(invitation -> invitation.getCreator().getId())
                        .findFirst())
                .orElse(null);
    }

    private RecommendedCreatorResponse resolveChosenCreator(
            List<OpportunityApplication> applications,
            List<OpportunityCreatorInvitation> invitations,
            Map<UUID, CreatorCandidate> candidatesById,
            List<Match> ranked) {

        UUID chosenId = chosenCreatorId(applications, invitations);
        if (chosenId == null) {
            return null;
        }

        // Reuse the ranked match (with its reasons) when the chosen creator was recommended.
        Match match = ranked.stream()
                .filter(m -> m.candidate().user().getId().equals(chosenId))
                .findFirst()
                .orElse(null);
        if (match != null) {
            return toResponse(match);
        }

        CreatorCandidate candidate = candidatesById.get(chosenId);
        if (candidate != null) {
            return toUnscoredResponse(candidate);
        }

        // Chosen before they stopped being a verified/active creator — still show who it was.
        User chosenUser = applications.stream()
                .map(OpportunityApplication::getCreator)
                .filter(user -> user.getId().equals(chosenId))
                .findFirst()
                .or(() -> invitations.stream()
                        .map(OpportunityCreatorInvitation::getCreator)
                        .filter(user -> user.getId().equals(chosenId))
                        .findFirst())
                .orElse(null);
        return chosenUser == null ? null : toUnscoredResponse(new CreatorCandidate(chosenUser, null, null, 0));
    }

    private RecommendedCreatorResponse toResponse(Match match) {
        return baseResponse(match.candidate())
                .matchPercentage(match.percentage())
                .reasons(match.reasons())
                .build();
    }

    /** A creator shown without a score (a chosen creator who no longer ranks) — no made-up percentage or reasons. */
    private RecommendedCreatorResponse toUnscoredResponse(CreatorCandidate candidate) {
        return baseResponse(candidate).matchPercentage(null).reasons(List.of()).build();
    }

    private RecommendedCreatorResponse.RecommendedCreatorResponseBuilder baseResponse(CreatorCandidate candidate) {
        User user = candidate.user();
        List<String> skills = candidate.skills();
        return RecommendedCreatorResponse.builder()
                .creatorId(user.getId())
                .name(user.getFullName())
                .avatarUrl(user.getProfilePhotoUrl())
                .rating(candidate.rating())
                .completedJobs(candidate.completedJobs())
                .specialty(skills.isEmpty() ? null : skills.get(0))
                .languages(candidate.languages())
                .about(candidate.about());
    }

    private static RecommendationOpportunitySummaryResponse toSummary(Opportunity opportunity) {
        return RecommendationOpportunitySummaryResponse.builder()
                .opportunityId(opportunity.getId())
                .title(opportunity.getTitle())
                .heroImageUrl(opportunity.getHeroImageUrl())
                .category(opportunity.getCategory())
                .location(opportunity.getLocation())
                .language(opportunity.getLanguage())
                .scheduledDate(opportunity.getScheduledDate())
                .build();
    }
}
