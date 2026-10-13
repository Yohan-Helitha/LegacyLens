package lk.ac.sliit.legacylens.marketplace.matching;

import java.util.List;
import java.util.Locale;

/**
 * Can the creator talk with the elder in the opportunity's language?
 *
 * Only what the creator declared on their application counts, and the credit
 * follows how well they said they speak it: fluent 1.0, intermediate 0.7,
 * basic 0.4. A creator who did not list the language - or listed no languages
 * at all - gets 0: someone may be fluent in Tamil and use it every day, so
 * nothing is assumed about a language they did not mention. When the
 * opportunity accepts several languages the creator's best one counts.
 *
 * An opportunity that names no language we can check (the elder did not say, or
 * it is not one of the three supported) puts no requirement on anyone, so
 * every creator gets full marks rather than losing points for nothing.
 */
final class LanguageFactor implements MatchFactor {

    private final int weight;

    LanguageFactor(int weight) {
        this.weight = weight;
    }

    @Override
    public int weight() {
        return weight;
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
            return FactorScore.of(1.0, null);
        }

        LanguageSkill best = null;
        for (LanguageSkill skill : context.candidate().languageSkills()) {
            if (requiredKnown.contains(skill.language())
                    && (best == null || skill.proficiency().credit() > best.proficiency().credit())) {
                best = skill;
            }
        }
        if (best == null) {
            return FactorScore.of(0.0, null);
        }
        String level = " (" + best.proficiency().name().toLowerCase(Locale.ROOT) + ")";
        return FactorScore.of(best.proficiency().credit(),
                context.say("Speaks " + best.language() + level, "You speak " + best.language() + level));
    }
}
