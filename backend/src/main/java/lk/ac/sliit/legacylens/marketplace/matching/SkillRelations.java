package lk.ac.sliit.legacylens.marketplace.service;

import java.util.Map;
import java.util.Set;

/**
 * How much one skill can stand in for another. Someone who photographs can
 * usually film a little; someone who translates can usually write.
 */
final class SkillRelations {

    static final double EXACT = 1.0;
    static final double CLOSE = 0.7;
    static final double SOMEWHAT = 0.4;

    private static final Map<CreatorSkill, Set<CreatorSkill>> CLOSE_TO = Map.of(
            CreatorSkill.PHOTOGRAPHY, Set.of(CreatorSkill.VIDEOGRAPHY),
            CreatorSkill.VIDEOGRAPHY, Set.of(CreatorSkill.PHOTOGRAPHY),
            CreatorSkill.WRITING, Set.of(CreatorSkill.TRANSLATION),
            CreatorSkill.TRANSLATION, Set.of(CreatorSkill.WRITING),
            CreatorSkill.AUDIO, Set.of(CreatorSkill.INTERVIEWING),
            CreatorSkill.INTERVIEWING, Set.of(CreatorSkill.AUDIO));

    private static final Map<CreatorSkill, Set<CreatorSkill>> SOMEWHAT_TO = Map.of(
            CreatorSkill.VIDEOGRAPHY, Set.of(CreatorSkill.AUDIO),
            CreatorSkill.AUDIO, Set.of(CreatorSkill.VIDEOGRAPHY),
            CreatorSkill.WRITING, Set.of(CreatorSkill.INTERVIEWING),
            CreatorSkill.INTERVIEWING, Set.of(CreatorSkill.WRITING, CreatorSkill.TRANSLATION),
            CreatorSkill.TRANSLATION, Set.of(CreatorSkill.INTERVIEWING));

    private SkillRelations() {
    }

    /** How well having {@code has} covers a need for {@code needed}: exact 1.0, closely related 0.7, somewhat related 0.4, else 0. */
    static double credit(CreatorSkill needed, CreatorSkill has) {
        if (needed == has) return EXACT;
        if (CLOSE_TO.getOrDefault(needed, Set.of()).contains(has)) return CLOSE;
        if (SOMEWHAT_TO.getOrDefault(needed, Set.of()).contains(has)) return SOMEWHAT;
        return 0;
    }
}
