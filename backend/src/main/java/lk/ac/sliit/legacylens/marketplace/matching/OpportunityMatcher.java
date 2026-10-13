package lk.ac.sliit.legacylens.marketplace.matching;

import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.matching.CreatorMatchScorer.CreatorCandidate;
import lk.ac.sliit.legacylens.marketplace.matching.CreatorMatchScorer.Match;
import lk.ac.sliit.legacylens.users.entity.City;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.CityRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Predicate;

/**
 * Creator -> opportunity matching. For one signed-in creator it loads everything
 * the scoring needs (their profile, past work, languages; the cities list; who may
 * be recommended what) once, then answers two questions per opportunity: may it be
 * recommended at all ({@link CreatorMatching#isEligible}), and how well does it fit
 * ({@link CreatorMatching#score}).
 */
@Component
public class OpportunityMatcher {

    private final CreatorCandidateLoader candidateLoader;
    private final CityRepository cityRepository;
    private final ElderTrustLookup elderTrustLookup;
    private final OpportunityEligibility eligibility;

    public OpportunityMatcher(
            CreatorCandidateLoader candidateLoader,
            CityRepository cityRepository,
            ElderTrustLookup elderTrustLookup,
            OpportunityEligibility eligibility) {

        this.candidateLoader = candidateLoader;
        this.cityRepository = cityRepository;
        this.elderTrustLookup = elderTrustLookup;
        this.eligibility = eligibility;
    }

    /** Matching for this creator; {@link CreatorMatching#isCreator()} is false when they have no creator profile. */
    public CreatorMatching forCreator(UUID creatorId) {
        if (creatorId == null) {
            return CreatorMatching.none();
        }
        return candidateLoader.loadCandidate(creatorId)
                .map(candidate -> new CreatorMatching(
                        candidate,
                        cityRepository.findAll(),
                        elderTrustLookup,
                        eligibility.forCreator(candidate, LocalDateTime.now())))
                .orElseGet(CreatorMatching::none);
    }

    /** One creator's view of the opportunities. */
    public static final class CreatorMatching {

        private static final CreatorMatching NONE = new CreatorMatching(null, List.of(), null, opportunity -> false);

        private final CreatorCandidate creator;
        private final List<City> cities;
        private final ElderTrustLookup elderTrustLookup;
        private final Predicate<Opportunity> eligible;
        private final Map<UUID, Double> trustByElder = new HashMap<>();

        private CreatorMatching(CreatorCandidate creator, List<City> cities, ElderTrustLookup elderTrustLookup,
                                Predicate<Opportunity> eligible) {
            this.creator = creator;
            this.cities = cities;
            this.elderTrustLookup = elderTrustLookup;
            this.eligible = eligible;
        }

        static CreatorMatching none() {
            return NONE;
        }

        public boolean isCreator() {
            return creator != null;
        }

        /** May this opportunity be recommended to the creator at all? */
        public boolean isEligible(Opportunity opportunity) {
            return eligible.test(opportunity);
        }

        /** How well the opportunity fits the creator, or null when the user is not a creator. */
        public Match score(Opportunity opportunity) {
            if (creator == null) {
                return null;
            }
            OpportunityNeeds needs = OpportunityNeedsAnalyser.analyse(opportunity, cities);
            return CreatorMatchScorer.scoreForCreator(needs, opportunity, creator, trustOf(opportunity.getElder()));
        }

        private Double trustOf(User elder) {
            if (elder == null) {
                return null;
            }
            return trustByElder.computeIfAbsent(elder.getId(), elderTrustLookup::trustOf);
        }
    }
}
