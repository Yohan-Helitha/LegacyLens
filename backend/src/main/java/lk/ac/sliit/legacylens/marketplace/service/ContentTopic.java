package lk.ac.sliit.legacylens.marketplace.service;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import static lk.ac.sliit.legacylens.marketplace.service.TextMatching.containsStem;

/**
 * Opportunity topics, each with the words that reveal it, the creator skills
 * it MUST have, skills that merely help, and creator interests that show a
 * real interest in the subject.
 */
public enum ContentTopic {
    DANCE("dance performance",
            List.of("dance", "dancing", "dancer", "kandyan", "performance", "drama", "theatre"),
            EnumSet.of(CreatorSkill.VIDEOGRAPHY), EnumSet.of(CreatorSkill.PHOTOGRAPHY),
            List.of("dance", "perform", "drama")),
    MUSIC("music tradition",
            List.of("music", "song", "singing", "singer", "drum", "instrument", "chant", "melody", "raban"),
            EnumSet.of(CreatorSkill.VIDEOGRAPHY, CreatorSkill.AUDIO), EnumSet.of(CreatorSkill.PHOTOGRAPHY),
            List.of("music", "song", "drum")),
    FOOD("traditional food",
            List.of("food", "recipe", "cook", "cuisine", "dish", "kitchen", "sweet", "kavum", "curry", "meal"),
            EnumSet.of(CreatorSkill.VIDEOGRAPHY, CreatorSkill.PHOTOGRAPHY), EnumSet.of(CreatorSkill.WRITING),
            List.of("food", "cook", "culinar", "recipe", "cuisine")),
    RITUAL("ritual or festival",
            // Not "tradition" — as a prefix it would also catch "traditional", which describes
            // nearly every opportunity (the "Tradition" category is mapped in CATEGORY_TOPICS instead).
            List.of("ritual", "festival", "perahera", "ceremony", "celebrat", "pooja", "puja", "new year",
                    "avurudu", "wedding"),
            EnumSet.of(CreatorSkill.VIDEOGRAPHY, CreatorSkill.PHOTOGRAPHY), EnumSet.of(CreatorSkill.INTERVIEWING),
            List.of("ritual", "festival", "tradition", "culture", "heritage")),
    CRAFT("traditional craft",
            List.of("craft", "pottery", "potter", "weav", "mask", "carv", "handloom", "lacquer", "artisan",
                    "batik", "brass", "jewell", "basket"),
            EnumSet.of(CreatorSkill.PHOTOGRAPHY, CreatorSkill.VIDEOGRAPHY), EnumSet.of(CreatorSkill.WRITING),
            List.of("craft", "art", "pottery", "weav", "mask")),
    STORY("story or oral history",
            List.of("story", "stories", "storytell", "oral history", "folklore", "folk", "legend", "memories",
                    "veteran", "histor", "childhood"),
            EnumSet.of(CreatorSkill.INTERVIEWING, CreatorSkill.VIDEOGRAPHY, CreatorSkill.AUDIO), EnumSet.of(CreatorSkill.WRITING),
            List.of("histor", "folk", "story", "stories", "heritage", "legend")),
    LANGUAGE("language or local words",
            List.of("language", "word", "terms", "dialect", "vocabular", "proverb", "saying", "glossary"),
            EnumSet.of(CreatorSkill.WRITING, CreatorSkill.TRANSLATION), EnumSet.of(CreatorSkill.AUDIO, CreatorSkill.VIDEOGRAPHY),
            List.of("language", "linguist", "literature")),
    LIVELIHOOD("fishing or farming tradition",
            List.of("fish", "boat", "stilt", "agricultur", "farm", "paddy", "harvest", "cultivat", "tea estate",
                    "tea plant"),
            EnumSet.of(CreatorSkill.VIDEOGRAPHY, CreatorSkill.PHOTOGRAPHY), EnumSet.of(CreatorSkill.WRITING),
            List.of("fish", "agricultur", "farm", "rural", "village"));

    final String label;
    private final List<String> signals;
    final Set<CreatorSkill> mustHave;
    final Set<CreatorSkill> helpful;
    private final List<String> interestStems;

    ContentTopic(String label, List<String> signals, Set<CreatorSkill> mustHave, Set<CreatorSkill> helpful, List<String> interestStems) {
        this.label = label;
        this.signals = signals;
        this.mustHave = mustHave;
        this.helpful = helpful;
        this.interestStems = interestStems;
    }

    boolean mentionedIn(String lowerText) {
        return signals.stream().anyMatch(signal -> containsStem(lowerText, signal));
    }

    boolean interestedBy(String lowerInterest) {
        return interestStems.stream().anyMatch(stem -> containsStem(lowerInterest, stem));
    }
}
