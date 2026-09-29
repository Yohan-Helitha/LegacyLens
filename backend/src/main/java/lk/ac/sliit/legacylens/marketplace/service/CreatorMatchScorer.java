package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.User;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Scores how well one content creator fits one of an elder's opportunities,
 * for the Content Creator Recommendation screen.
 *
 * Deliberately a small, explainable heuristic (same spirit as
 * OpportunityServiceImpl#computeMatchPercentage) rather than a learned model —
 * there's no interaction history to train on yet. Every point awarded comes
 * with the plain-language reason the elder sees under "Why we recommend this
 * person", so the explanation can never disagree with the ranking.
 *
 * A creator is only a match if at least one opportunity-specific signal fires
 * (category/skill, language, location, or having applied). Rating and
 * experience only break ties between real matches — being well-rated alone
 * doesn't make someone right for a particular opportunity.
 */
public final class CreatorMatchScorer {

    static final int CATEGORY_POINTS = 35;
    static final int SKILL_POINTS = 10;
    static final int MAX_SKILL_POINTS = 20;
    static final int LANGUAGE_POINTS = 20;
    static final int LOCATION_POINTS = 20;
    static final int APPLIED_POINTS = 15;
    static final int MAX_RATING_POINTS = 10;
    static final int MAX_EXPERIENCE_POINTS = 10;

    /** Ratings at or above this are called out as a reason; lower ones still count towards the score. */
    private static final BigDecimal HIGH_RATING = new BigDecimal("4.0");
    /** Completed-job counts at or above this are called out as a reason. */
    private static final long EXPERIENCED_JOBS = 3;

    /** Languages recognised in a creator's free-text profile — the platform's three onboarding languages. */
    private static final List<String> KNOWN_LANGUAGES = List.of("Sinhala", "Tamil", "English");

    private CreatorMatchScorer() {
    }

    /**
     * Everything known about one candidate creator, gathered once per request
     * so scoring several opportunities never re-queries the database.
     */
    public record CreatorCandidate(
            User user,
            CreatorProfile profile,
            CreatorApplication application,
            long completedJobs) {

        /** Skill tags from the verified profile, falling back to the creator application's. */
        public List<String> skills() {
            String raw = profile != null && hasText(profile.getSkills())
                    ? profile.getSkills()
                    : application != null ? application.getSkills() : null;
            return splitTags(raw);
        }

        /** Skills + interests, lower-cased, from both the profile and the application. */
        String keywordText() {
            StringBuilder text = new StringBuilder();
            if (profile != null) {
                append(text, profile.getSkills());
                append(text, profile.getInterests());
            }
            if (application != null) {
                append(text, application.getSkills());
                append(text, application.getInterests());
            }
            return text.toString().toLowerCase(Locale.ROOT);
        }

        /** Every known language mentioned anywhere in the creator's profile or application text. */
        public List<String> languages() {
            StringBuilder text = new StringBuilder(keywordText());
            if (application != null) {
                append(text, application.getAboutYou());
                append(text, application.getExperienceDescription());
            }
            String haystack = text.toString().toLowerCase(Locale.ROOT);
            return KNOWN_LANGUAGES.stream()
                    .filter(language -> haystack.contains(language.toLowerCase(Locale.ROOT)))
                    .toList();
        }

        public String about() {
            if (application == null) {
                return null;
            }
            if (hasText(application.getAboutYou())) {
                return application.getAboutYou().trim();
            }
            return hasText(application.getExperienceDescription()) ? application.getExperienceDescription().trim() : null;
        }

        public BigDecimal rating() {
            return profile != null ? profile.getRating() : null;
        }

        String cityName() {
            return user.getCity() != null ? user.getCity().getName() : null;
        }
    }

    /** A candidate's score for one opportunity. {@code relevant} is false when nothing opportunity-specific matched. */
    public record Match(CreatorCandidate candidate, int score, boolean relevant, List<String> reasons) {
    }

    /**
     * @param hasApplied whether this creator has submitted an application to this opportunity
     */
    public static Match score(Opportunity opportunity, CreatorCandidate candidate, boolean hasApplied) {
        int score = 0;
        boolean relevant = false;
        List<String> reasons = new ArrayList<>();

        String keywords = candidate.keywordText();
        String category = opportunity.getCategory();
        if (hasText(category) && keywords.contains(category.trim().toLowerCase(Locale.ROOT))) {
            score += CATEGORY_POINTS;
            relevant = true;
            reasons.add("Has experience with " + category.trim() + " work");
        }

        // Individual skills named in the opportunity itself (e.g. "Video Editing" in a
        // title about recording a recipe on video) — capped so one long skill list can't dominate.
        String opportunityText = (nullToEmpty(opportunity.getTitle()) + " " + nullToEmpty(opportunity.getDescription())
                + " " + nullToEmpty(category)).toLowerCase(Locale.ROOT);
        int skillPoints = 0;
        for (String skill : candidate.skills()) {
            if (skillPoints >= MAX_SKILL_POINTS) {
                break;
            }
            if (skillMentioned(skill, opportunityText) && !skill.equalsIgnoreCase(nullToEmpty(category).trim())) {
                skillPoints += SKILL_POINTS;
                reasons.add("Skilled in " + skill);
            }
        }
        if (skillPoints > 0) {
            score += skillPoints;
            relevant = true;
        }

        String language = opportunity.getLanguage();
        if (hasText(language)) {
            for (String spoken : candidate.languages()) {
                if (language.toLowerCase(Locale.ROOT).contains(spoken.toLowerCase(Locale.ROOT))) {
                    score += LANGUAGE_POINTS;
                    relevant = true;
                    reasons.add("Speaks " + spoken);
                    break;
                }
            }
        }

        String city = candidate.cityName();
        String location = opportunity.getLocation();
        if (hasText(city) && hasText(location)
                && location.toLowerCase(Locale.ROOT).contains(city.trim().toLowerCase(Locale.ROOT))) {
            score += LOCATION_POINTS;
            relevant = true;
            reasons.add("Lives in " + city.trim() + ", close to this opportunity");
        }

        if (hasApplied) {
            score += APPLIED_POINTS;
            relevant = true;
            reasons.add("Has already applied for this opportunity");
        }

        BigDecimal rating = candidate.rating();
        if (rating != null) {
            // 5.00 stars -> the full MAX_RATING_POINTS.
            score += rating.multiply(BigDecimal.valueOf(MAX_RATING_POINTS))
                    .divide(BigDecimal.valueOf(5), 0, RoundingMode.HALF_UP)
                    .intValue();
            if (rating.compareTo(HIGH_RATING) >= 0) {
                reasons.add("Highly rated by other elders (" + rating.setScale(1, RoundingMode.HALF_UP) + " stars)");
            }
        }

        long jobs = candidate.completedJobs();
        score += (int) Math.min(jobs, MAX_EXPERIENCE_POINTS);
        if (jobs >= EXPERIENCED_JOBS) {
            reasons.add("Has completed " + jobs + " jobs on LegacyLens");
        }

        return new Match(candidate, score, relevant, List.copyOf(reasons));
    }

    /** A skill counts as mentioned if the whole tag, or every word of it longer than 3 letters, appears. */
    private static boolean skillMentioned(String skill, String opportunityText) {
        String lower = skill.toLowerCase(Locale.ROOT);
        if (opportunityText.contains(lower)) {
            return true;
        }
        List<String> words = Arrays.stream(lower.split("\\s+")).filter(word -> word.length() > 3).toList();
        return !words.isEmpty() && words.stream().allMatch(opportunityText::contains);
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

    private static void append(StringBuilder text, String value) {
        if (hasText(value)) {
            text.append(value).append(',');
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
