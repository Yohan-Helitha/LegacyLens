package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.users.entity.City;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.User;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static lk.ac.sliit.legacylens.marketplace.service.TextMatching.containsStem;
import static lk.ac.sliit.legacylens.marketplace.service.TextMatching.hasText;
import static lk.ac.sliit.legacylens.marketplace.service.TextMatching.nullToEmpty;
import static lk.ac.sliit.legacylens.marketplace.service.TextMatching.splitTags;

/**
 * Matches content creators to an elder's opportunity for the Content
 * Creator Recommendation screen.
 *
 * <h2>1. What does the opportunity need?</h2>
 * Different opportunities need different creators — a dance performance needs
 * someone who films, a craft needs someone who photographs, an old story needs
 * someone who interviews and records. {@link OpportunityNeedsAnalyser#analyse} works this out:
 * <ul>
 *   <li>The admin's own "Required Skills" (Opportunity.requiredSkills) win when
 *       set — they are exactly what the job needs.</li>
 *   <li>Otherwise the need is inferred from the category, title, description,
 *       preservation goal and tasks using the {@link ContentTopic} table below.</li>
 *   <li>If nothing at all can be inferred, any recognised creator skill is
 *       accepted, but only for partial credit — so such a creator can be
 *       recommended, yet never becomes the best match on a guess.</li>
 * </ul>
 *
 * <h2>2. How well does each creator fit? (0–100)</h2>
 * <pre>
 *   Can do a MUST-HAVE task ............ 45   (only a helpful task: 20, unknown need: 30)
 *   Can also do another needed task .... +10
 *   Interested in the topic ............ 15   (e.g. "Traditional Foods" for a recipe)
 *   Location: same city 15 · same province 8 · "Remote OK" 15
 *   Speaks the opportunity's language .. 10
 *   Already applied .................... 5
 *   Rating + completed jobs ............ up to 5
 * </pre>
 * Every point comes with the plain-language reason the elder sees, so the
 * explanation can never disagree with the ranking.
 *
 * <h2>3. Hard rules</h2>
 * <ul>
 *   <li><b>No task skill, no recommendation.</b> A creator who can't do any
 *       task the opportunity needs is never shown, however close or well-rated.</li>
 *   <li><b>Recommended</b> only at {@value #RECOMMEND_MIN}% or more.</li>
 *   <li><b>Best match</b> only at {@value #BEST_MATCH_MIN}% or more AND able to
 *       do a must-have task. When nobody reaches that, there is simply no best
 *       match — the bar is never lowered to fill the slot.</li>
 * </ul>
 */
public final class CreatorMatchScorer {

    /** Minimum score to be listed at all. */
    public static final int RECOMMEND_MIN = 45;
    /** Minimum score to be highlighted as the single best match. */
    public static final int BEST_MATCH_MIN = 75;

    static final int MUST_HAVE_POINTS = 45;
    static final int GENERAL_SKILL_POINTS = 30;
    static final int HELPFUL_ONLY_POINTS = 20;
    static final int EXTRA_SKILL_POINTS = 10;
    static final int TOPIC_POINTS = 15;
    static final int SAME_CITY_POINTS = 15;
    static final int SAME_REGION_POINTS = 8;
    static final int REMOTE_POINTS = 15;
    static final int LANGUAGE_POINTS = 10;
    static final int APPLIED_POINTS = 5;
    static final int MAX_RATING_POINTS = 3;
    static final int MAX_EXPERIENCE_POINTS = 2;
    /** Completed jobs at which the experience points max out. */
    private static final int EXPERIENCE_JOBS_FOR_MAX = 10;

    private static final BigDecimal HIGH_RATING = new BigDecimal("4.0");
    private static final long EXPERIENCED_JOBS = 3;

    /** Languages recognised in a creator's free-text profile — the platform's three onboarding languages. */
    private static final List<String> KNOWN_LANGUAGES = List.of("Sinhala", "Tamil", "English");

    private CreatorMatchScorer() {
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Creators
    // ─────────────────────────────────────────────────────────────────────────

    /** Everything known about one candidate creator, gathered once per request. */
    public record CreatorCandidate(
            User user,
            CreatorProfile profile,
            CreatorApplication application,
            long completedJobs) {

        /** CreatorSkill tags from the verified profile and the creator application, de-duplicated. */
        public List<String> skills() {
            Set<String> tags = new LinkedHashSet<>();
            if (profile != null) tags.addAll(splitTags(profile.getSkills()));
            if (application != null) tags.addAll(splitTags(application.getSkills()));
            return List.copyOf(tags);
        }

        public List<String> interests() {
            Set<String> tags = new LinkedHashSet<>();
            if (profile != null) tags.addAll(splitTags(profile.getInterests()));
            if (application != null) tags.addAll(splitTags(application.getInterests()));
            return List.copyOf(tags);
        }

        /**
         * Each skill this creator has, mapped to the first of their own tags
         * that shows it — so reasons quote the creator's words ("Skilled in
         * Basic Video Editing"), not an internal label.
         */
        Map<CreatorSkill, String> skillEvidence() {
            Map<CreatorSkill, String> evidence = new LinkedHashMap<>();
            for (String tag : skills()) {
                String lower = tag.toLowerCase(Locale.ROOT);
                for (CreatorSkill skill : CreatorSkill.values()) {
                    if (!evidence.containsKey(skill) && skill.matches(lower)) {
                        evidence.put(skill, tag);
                    }
                }
            }
            return evidence;
        }

        /** Every known language mentioned anywhere in the creator's profile or application text. */
        public List<String> languages() {
            StringBuilder text = new StringBuilder();
            skills().forEach(tag -> text.append(tag).append(','));
            interests().forEach(tag -> text.append(tag).append(','));
            if (application != null) {
                text.append(nullToEmpty(application.getAboutYou())).append(',');
                text.append(nullToEmpty(application.getExperienceDescription()));
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

        City city() {
            return user.getCity();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scoring
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * One creator's fit for one opportunity.
     *
     * @param percentage     0–100
     * @param canDoMustHave  covers at least one must-have skill (required for best match)
     * @param canDoTheWork   covers any needed skill at all — without this they are never shown
     * @param reasons        plain-language "why we recommend this person", strongest first
     */
    public record Match(
            CreatorCandidate candidate,
            int percentage,
            boolean canDoMustHave,
            boolean canDoTheWork,
            List<String> reasons) {

        public boolean recommendable() {
            return canDoTheWork && percentage >= RECOMMEND_MIN;
        }

        public boolean bestMatchWorthy() {
            return canDoMustHave && percentage >= BEST_MATCH_MIN;
        }
    }

    /**
     * @param hasApplied whether this creator has submitted an application to this opportunity
     */
    public static Match score(OpportunityNeeds needs, Opportunity opportunity, CreatorCandidate candidate, boolean hasApplied) {
        int points = 0;
        List<String> reasons = new ArrayList<>();
        Map<CreatorSkill, String> evidence = candidate.skillEvidence();

        // ── Can they do the work? ─────────────────────────────────────────
        boolean canDoMustHave = false;
        boolean canDoTheWork = false;
        String topicLabel = needs.topics().isEmpty() ? "opportunity" : needs.topics().get(0).label;

        if (needs.unknownNeed()) {
            // Nothing tells us what's needed — any real creator skill earns partial credit only.
            String firstSkill = evidence.values().stream().findFirst().orElse(null);
            if (firstSkill != null) {
                canDoTheWork = true;
                points += GENERAL_SKILL_POINTS;
                reasons.add("Skilled in " + firstSkill);
            }
        } else {
            List<String> mustHaveTags = new ArrayList<>();
            for (CreatorSkill skill : needs.mustHave()) {
                if (evidence.containsKey(skill)) mustHaveTags.add(evidence.get(skill));
            }
            List<String> helpfulTags = new ArrayList<>();
            for (CreatorSkill skill : needs.helpful()) {
                if (evidence.containsKey(skill)) helpfulTags.add(evidence.get(skill));
            }

            if (!mustHaveTags.isEmpty()) {
                canDoMustHave = true;
                canDoTheWork = true;
                points += MUST_HAVE_POINTS;
                reasons.add("Skilled in " + mustHaveTags.get(0) + " — needed for this " + topicLabel);
                String extra = mustHaveTags.size() > 1 ? mustHaveTags.get(1) : helpfulTags.isEmpty() ? null : helpfulTags.get(0);
                if (extra != null) {
                    points += EXTRA_SKILL_POINTS;
                    reasons.add("Can also help with " + extra);
                }
            } else if (!helpfulTags.isEmpty()) {
                canDoTheWork = true;
                points += HELPFUL_ONLY_POINTS;
                reasons.add("Skilled in " + helpfulTags.get(0) + ", which can help with this " + topicLabel);
            }
        }

        // ── Do they care about the subject? ───────────────────────────────
        outer:
        for (ContentTopic topic : needs.topics()) {
            for (String interest : candidate.interests()) {
                if (topic.interestedBy(interest.toLowerCase(Locale.ROOT))) {
                    points += TOPIC_POINTS;
                    reasons.add("Interested in " + interest);
                    break outer;
                }
            }
        }

        // ── Can they get there? ───────────────────────────────────────────
        City creatorCity = candidate.city();
        if (needs.remote()) {
            points += REMOTE_POINTS;
            reasons.add("Can work on this remotely");
        } else if (creatorCity != null && needs.city() != null) {
            if (sameCity(creatorCity, needs.city())) {
                points += SAME_CITY_POINTS;
                reasons.add("Lives in " + creatorCity.getName() + ", where this takes place");
            } else if (hasText(creatorCity.getRegion()) && hasText(needs.city().getRegion())
                    && creatorCity.getRegion().trim().equalsIgnoreCase(needs.city().getRegion().trim())) {
                points += SAME_REGION_POINTS;
                reasons.add("Lives nearby in " + creatorCity.getName() + " (" + creatorCity.getRegion().trim() + ")");
            }
        } else if (creatorCity != null && hasText(opportunity.getLocation())
                && containsStem(opportunity.getLocation().toLowerCase(Locale.ROOT), creatorCity.getName().toLowerCase(Locale.ROOT))) {
            // Location text names the creator's city even though it isn't in the cities table.
            points += SAME_CITY_POINTS;
            reasons.add("Lives in " + creatorCity.getName() + ", where this takes place");
        }

        // ── Can they talk with the elder? ─────────────────────────────────
        String language = opportunity.getLanguage();
        if (hasText(language)) {
            String lowerLanguage = language.toLowerCase(Locale.ROOT);
            String spoken = candidate.languages().stream()
                    .filter(known -> lowerLanguage.contains(known.toLowerCase(Locale.ROOT)))
                    .findFirst()
                    .orElse(null);
            if (spoken != null) {
                points += LANGUAGE_POINTS;
                reasons.add("Speaks " + spoken);
            }
        }

        if (hasApplied) {
            points += APPLIED_POINTS;
            reasons.add("Has already applied for this opportunity");
        }

        // ── Track record (small — it only separates otherwise equal fits) ─
        BigDecimal rating = candidate.rating();
        if (rating != null) {
            points += rating.multiply(BigDecimal.valueOf(MAX_RATING_POINTS))
                    .divide(BigDecimal.valueOf(5), 0, RoundingMode.HALF_UP)
                    .intValue();
            if (rating.compareTo(HIGH_RATING) >= 0) {
                reasons.add("Highly rated by other elders (" + rating.setScale(1, RoundingMode.HALF_UP) + " stars)");
            }
        }
        long jobs = candidate.completedJobs();
        points += (int) (Math.min(jobs, EXPERIENCE_JOBS_FOR_MAX) * MAX_EXPERIENCE_POINTS / EXPERIENCE_JOBS_FOR_MAX);
        if (jobs >= EXPERIENCED_JOBS) {
            reasons.add("Has completed " + jobs + " jobs on LegacyLens");
        }

        // Someone who can't do any needed task scores 0 — they must never outrank, or appear beside, real matches.
        int percentage = canDoTheWork ? Math.min(100, points) : 0;
        return new Match(candidate, percentage, canDoMustHave, canDoTheWork, List.copyOf(reasons));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static boolean sameCity(City a, City b) {
        if (a.getId() != null && b.getId() != null) {
            return a.getId().equals(b.getId());
        }
        return a.getName() != null && a.getName().equalsIgnoreCase(b.getName());
    }
}
