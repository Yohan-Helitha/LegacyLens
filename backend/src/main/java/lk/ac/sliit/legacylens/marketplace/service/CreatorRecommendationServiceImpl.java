package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityRecommendationsResponse;
import lk.ac.sliit.legacylens.marketplace.dto.RecommendedCreatorResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorInvitationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityCreatorInvitation;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.matching.CreatorCandidateLoader;
import lk.ac.sliit.legacylens.marketplace.matching.CreatorMatchScorer;
import lk.ac.sliit.legacylens.marketplace.matching.ElderTrustLookup;
import lk.ac.sliit.legacylens.marketplace.matching.OpportunityNeeds;
import lk.ac.sliit.legacylens.marketplace.matching.OpportunityNeedsAnalyser;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityCreatorInvitationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.marketplace.matching.CreatorMatchScorer.CreatorCandidate;
import lk.ac.sliit.legacylens.marketplace.matching.CreatorMatchScorer.Match;
import lk.ac.sliit.legacylens.messaging.service.ConversationOpener;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.entity.City;
import lk.ac.sliit.legacylens.users.repository.CityRepository;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
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
    private final CityRepository cityRepository;
    private final ConversationOpener conversationOpener;
    private final CreatorCandidateLoader candidateLoader;
    private final RecommendationResponseMapper responseMapper;
    private final ChosenCreatorResolver chosenCreatorResolver;
    private final ElderTrustLookup elderTrustLookup;

    public CreatorRecommendationServiceImpl(
            OpportunityRepository opportunityRepository,
            OpportunityApplicationRepository opportunityApplicationRepository,
            OpportunityCreatorInvitationRepository invitationRepository,
            CreatorProfileRepository creatorProfileRepository,
            CityRepository cityRepository,
            ConversationOpener conversationOpener,
            CreatorCandidateLoader candidateLoader,
            RecommendationResponseMapper responseMapper,
            ChosenCreatorResolver chosenCreatorResolver,
            ElderTrustLookup elderTrustLookup) {

        this.opportunityRepository = opportunityRepository;
        this.opportunityApplicationRepository = opportunityApplicationRepository;
        this.invitationRepository = invitationRepository;
        this.creatorProfileRepository = creatorProfileRepository;
        this.cityRepository = cityRepository;
        this.conversationOpener = conversationOpener;
        this.candidateLoader = candidateLoader;
        this.responseMapper = responseMapper;
        this.chosenCreatorResolver = chosenCreatorResolver;
        this.elderTrustLookup = elderTrustLookup;
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
        List<CreatorCandidate> candidates = candidateLoader.loadCandidates(elderId);
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
        Double elderTrust = elderTrustLookup.trustOf(elderId);

        return opportunities.stream()
                .map(opportunity -> buildSection(
                        opportunity,
                        OpportunityNeedsAnalyser.analyse(opportunity, cities),
                        candidates,
                        candidatesById,
                        elderTrust,
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
        UUID alreadyChosen = chosenCreatorResolver.chosenCreatorId(applications, invitationRepository.findByOpportunityId(opportunityId));
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
            conversationOpener.openConversation(elderId, creatorId, opportunityId);
            return;
        }

        OpportunityCreatorInvitation invitation = new OpportunityCreatorInvitation();
        invitation.setOpportunity(opportunity);
        invitation.setCreator(profile.getUser());
        invitation.setStatus(CreatorInvitationStatus.INVITED);
        invitationRepository.save(invitation);

        // Choosing someone opens a chat with them straight away, so the elder can say hello.
        conversationOpener.openConversation(elderId, creatorId, opportunityId);
    }

    private OpportunityRecommendationsResponse buildSection(
            Opportunity opportunity,
            OpportunityNeeds needs,
            List<CreatorCandidate> candidates,
            Map<UUID, CreatorCandidate> candidatesById,
            Double elderTrust,
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
                        needs, opportunity, candidate, appliedCreatorIds.contains(candidate.user().getId()), elderTrust))
                .filter(Match::recommendable)
                .sorted(RANKING)
                .toList();

        // The top creator is only the "Best match" if they clear the higher bar. If
        // they don't, there is no best match — everyone is shown as a recommendation.
        boolean hasBestMatch = !ranked.isEmpty() && ranked.get(0).bestMatchWorthy();
        RecommendedCreatorResponse bestMatch = hasBestMatch ? responseMapper.toResponse(ranked.get(0)) : null;
        List<RecommendedCreatorResponse> others = ranked.stream()
                .skip(hasBestMatch ? 1 : 0)
                .limit(hasBestMatch ? MAX_OTHERS : MAX_RECOMMENDATIONS_WITHOUT_BEST)
                .map(responseMapper::toResponse)
                .toList();

        return OpportunityRecommendationsResponse.builder()
                .opportunity(responseMapper.toSummary(opportunity))
                .bestMatch(bestMatch)
                .others(others)
                .chosenCreator(chosenCreatorResolver.resolve(applications, invitations, candidatesById, ranked))
                .build();
    }
}
