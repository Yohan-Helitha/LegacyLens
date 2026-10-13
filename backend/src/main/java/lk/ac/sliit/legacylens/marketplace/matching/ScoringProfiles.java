package lk.ac.sliit.legacylens.marketplace.matching;

import java.util.List;

/**
 * The two weightings.
 *
 * <pre>
 *                              elder -> creator   creator -> opportunity
 *   Previous relevant work           30%                  35%
 *   Required skills                  25%                  25%
 *   Language                         20%                  20%
 *   Experience                       15%                  10%
 *   Location                         10%                  10%
 * </pre>
 * A creator's past work is the strongest hint of which future work will suit
 * them, so it counts for more when recommending opportunities to a creator.
 */
final class ScoringProfiles {

    static final ScoringProfile FOR_ELDER = new ScoringProfile(Audience.ELDER, List.of(
            new PreviousWorkFactor(30),
            new SkillsFactor(25),
            new LanguageFactor(20),
            new ExperienceFactor(15),
            new LocationFactor(10)));

    static final ScoringProfile FOR_CREATOR = new ScoringProfile(Audience.CREATOR, List.of(
            new PreviousWorkFactor(35),
            new SkillsFactor(25),
            new LanguageFactor(20),
            new LocationFactor(10),
            new ExperienceFactor(10)));

    private ScoringProfiles() {
    }
}
