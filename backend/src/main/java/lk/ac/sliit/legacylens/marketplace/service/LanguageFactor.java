package lk.ac.sliit.legacylens.marketplace.service;

import java.util.List;
import java.util.Locale;

/**
 * 20% - can the creator talk with the elder in the opportunity's language?
 *
 * Creators are not asked how well they speak a language, only what they write
 * about themselves, so this is all-or-nothing when we do know: a creator who
 * mentions the language gets full marks, one who lists other languages but not
 * this one gets none. A creator who mentions no language at all is unknown,
 * not unable, and gets half.
 */
final class LanguageFactor implements MatchFactor {

    static final int WEIGHT = 20;
    private static final double UNKNOWN = 0.5;

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

        List<String> spoken = context.candidate().languages();
        String shared = spoken.stream().filter(requiredKnown::contains).findFirst().orElse(null);
        if (shared != null) {
            return FactorScore.of(1.0, "Speaks " + shared);
        }
        return FactorScore.of(spoken.isEmpty() ? UNKNOWN : 0.0, null);
    }
}
