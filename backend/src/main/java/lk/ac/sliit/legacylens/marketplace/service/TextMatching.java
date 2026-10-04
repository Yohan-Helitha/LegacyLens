package lk.ac.sliit.legacylens.marketplace.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/** Small text helpers shared by the matching classes. */
final class TextMatching {

    private TextMatching() {
    }

    /**
     * True when {@code stem} starts a word in {@code lowerText} — "photo" matches
     * "photography" and "Photo walk" but "art" does not match "party".
     */
    static boolean containsStem(String lowerText, String stem) {
        return Pattern.compile("(?<![\\p{L}\\p{N}])" + Pattern.quote(stem)).matcher(lowerText).find();
    }

    static List<String> splitTags(String raw) {
        if (!hasText(raw)) {
            return List.of();
        }
        Set<String> tags = new LinkedHashSet<>();
        for (String tag : raw.split(",")) {
            if (!tag.isBlank()) {
                tags.add(tag.trim());
            }
        }
        return List.copyOf(tags);
    }

    static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
