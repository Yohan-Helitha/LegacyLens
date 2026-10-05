package lk.ac.sliit.legacylens.marketplace.service;

import java.util.List;
import java.util.Locale;

/**
 * 20% - can the creator talk with the elder in the opportunity's language?
 *
 * Creators say how well they speak each language on their application, and
 * the credit follows that: fluent 1.0, intermediate 0.7, basic 0.4. A creator
 * who lists languages but not this one gets 0. When the opportunity accepts
 * several languages the creator's best one counts.
 *
 * Two cases where we do not know the level, so we do not guess low: a creator
 * who applied before levels were asked for and only mentions the language in
 * their text gets 0.7, and a creator who mentions no language at all gets 0.5.
 */
final class LanguageFactor implements MatchFactor {

    static final int WEIGHT = 20;
    static final double LEVEL_UNKNOWN = 0.7;
    static final double NO_LANGUAGE_INFORMATION = 0.5;

    @Override
    public int weight() {
        return WEIGHT;
    }

    @Override
    public FactorScore evaluate(MatchContext context) {
        String required = context.opportunity().getLanguage();
        if (required == null || required.isBlank()) {
            return FactorScore.of(1.0, null);
        }
        String lowerRequired = required.toLowerCase(Locale.ROOT);
        List<String> requiredKnown = SupportedLanguages.ALL.stream()
                .filter(language -> lowerRequired.contains(language.toLowerCase(Locale.ROOT)))
                .toList();
        if (requiredKnown.isEmpty()) {
            return FactorScore.of(1.0, null); // a language we cannot check - never hold it against anyone
        }

        List<LanguageSkill> spoken = context.candidate().languageSkills();
        LanguageSkill best = null;
        double bestCredit = -1;
        for (LanguageSkill skill : spoken) {
            if (!requiredKnown.contains(skill.language())) {
                continue;
            }
            double credit = skill.proficiency() == null ? LEVEL_UNKNOWN : skill.proficiency().credit();
            if (credit > bestCredit) {
                best = skill;
                bestCredit = credit;
            }
        }

        if (best != null) {
            String level = best.proficiency() == null ? "" : " (" + best.proficiency().name().toLowerCase(Locale.ROOT) + ")";
            return FactorScore.of(bestCredit, "Speaks " + best.language() + level);
        }
        return FactorScore.of(spoken.isEmpty() ? NO_LANGUAGE_INFORMATION : 0.0, null);
    }
}
