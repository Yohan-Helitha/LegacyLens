package lk.ac.sliit.legacylens.marketplace.service;

import java.util.List;

/**
 * One way of weighing the five factors, and who the explanation is for.
 * The factors themselves are shared; only the weights and the wording differ
 * between "which creators suit this opportunity?" and "which opportunities suit
 * this creator?".
 */
record ScoringProfile(Audience audience, List<MatchFactor> factors) {

    ScoringProfile {
        int total = factors.stream().mapToInt(MatchFactor::weight).sum();
        if (total != 100) {
            throw new IllegalStateException("Scoring weights must add up to 100 but add up to " + total);
        }
        factors = List.copyOf(factors);
    }
}
