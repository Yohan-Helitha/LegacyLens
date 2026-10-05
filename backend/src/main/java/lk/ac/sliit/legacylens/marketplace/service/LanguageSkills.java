package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.marketplace.dto.LanguageSkillResponse;
import lk.ac.sliit.legacylens.marketplace.entity.LanguageProficiency;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Reads, validates and stores the languages a creator speaks.
 *
 * On the wire and in the database a language is written "Sinhala:FLUENT";
 * several are joined with commas ("Sinhala:FLUENT,English:BASIC").
 */
final class LanguageSkills {

    private LanguageSkills() {
    }

    /** The entries submitted on the form, checked: known language, known level, no language twice, at least one. */
    static List<LanguageSkill> parseSubmitted(List<String> entries) {
        if (entries == null || entries.isEmpty()) {
            throw new InvalidRequestException("Select at least one language");
        }
        List<LanguageSkill> skills = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (String entry : entries) {
            String[] parts = entry == null ? new String[0] : entry.split(":", 2);
            if (parts.length != 2) {
                throw new InvalidRequestException("Choose how well you speak each language you select");
            }
            String language = canonical(parts[0]);
            if (language == null) {
                throw new InvalidRequestException("Unsupported language: " + parts[0].trim());
            }
            LanguageProficiency level;
            try {
                level = LanguageProficiency.valueOf(parts[1].trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new InvalidRequestException("Unknown language level for " + language + ": " + parts[1].trim());
            }
            if (!seen.add(language)) {
                throw new InvalidRequestException(language + " was selected more than once");
            }
            skills.add(new LanguageSkill(language, level));
        }
        return List.copyOf(skills);
    }

    static String serialize(List<LanguageSkill> skills) {
        return skills.stream()
                .map(skill -> skill.language() + ":" + skill.proficiency().name())
                .reduce((a, b) -> a + "," + b)
                .orElse("");
    }

    /** What is stored; empty for an application made before languages were asked for. */
    static List<LanguageSkill> deserialize(String stored) {
        if (stored == null || stored.isBlank()) {
            return List.of();
        }
        List<LanguageSkill> skills = new ArrayList<>();
        for (String entry : stored.split(",")) {
            String[] parts = entry.split(":", 2);
            String language = canonical(parts[0]);
            if (language == null) {
                continue;
            }
            LanguageProficiency level = null;
            if (parts.length == 2) {
                try {
                    level = LanguageProficiency.valueOf(parts[1].trim().toUpperCase(Locale.ROOT));
                } catch (IllegalArgumentException ignored) {
                    // keep the language, level unknown
                }
            }
            skills.add(new LanguageSkill(language, level));
        }
        return List.copyOf(skills);
    }

    /** The languages as shown to the app: name and level (level null when unknown). */
    static List<LanguageSkillResponse> toResponses(List<LanguageSkill> skills) {
        return skills.stream()
                .map(skill -> LanguageSkillResponse.builder()
                        .language(skill.language())
                        .proficiency(skill.proficiency() == null ? null : skill.proficiency().name())
                        .build())
                .toList();
    }

    /** Languages merely mentioned in free text, level unknown - the fallback for creators who never picked any. */
    static List<LanguageSkill> detectInText(String text) {
        String haystack = text == null ? "" : text.toLowerCase(Locale.ROOT);
        return SupportedLanguages.ALL.stream()
                .filter(language -> haystack.contains(language.toLowerCase(Locale.ROOT)))
                .map(language -> new LanguageSkill(language, null))
                .toList();
    }

    private static String canonical(String name) {
        String trimmed = name == null ? "" : name.trim();
        return SupportedLanguages.ALL.stream()
                .filter(language -> language.equalsIgnoreCase(trimmed))
                .findFirst()
                .orElse(null);
    }
}
