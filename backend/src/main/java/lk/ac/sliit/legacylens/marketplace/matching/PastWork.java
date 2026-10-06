package lk.ac.sliit.legacylens.marketplace.service;

import java.util.Locale;

/** One job a creator has already completed on the platform, with the category of the opportunity it came from. */
public record PastWork(String title, String description, String category) {

    /** Lower-cased words describing the job, for matching against what a new opportunity is about. */
    String searchableText() {
        return String.join(" ",
                title == null ? "" : title,
                description == null ? "" : description,
                category == null ? "" : category).toLowerCase(Locale.ROOT);
    }
}
