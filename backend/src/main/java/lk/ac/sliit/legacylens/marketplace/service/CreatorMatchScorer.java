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
 * {@link OpportunityNeedsAnalyser#analyse} works out which skills the job
 * needs (the admin's Required Skills win; otherwise they are inferred from the
 * category, title, description and tasks) and what it is about.
 *
 * <h2>2. How well does each creator fit? (0-100)</h2>
 * A weighted sum of five factors, each answering with a fraction from 0 to 1
 * - similarity, not a yes/no, so partial fits earn partial credit:
 * <pre>
 *   Previous relevant work .... 30%   {@link PreviousWorkFactor}
 *   Required skills ........... 25%   {@link SkillsFactor}
 *   Language .................. 20%   {@link LanguageFactor}
 *   Experience level .......... 15%   {@link ExperienceFactor}   (judged against the elder's trust)
 *   Location / distance ....... 10%   {@link LocationFactor}
 * </pre>
 * Example: 0.80x30 + 0.75x25 + 1.00x20 + 0.70x15 + 0.80x10 = 81.25, shown as 81%.
 * Every factor also supplies the plain-language reason the elder sees, so the
 * explanation can never disagree with the ranking.
 *
 * <h2>3. Hard rules</h2>
 * <ul>
 *   <li><b>No task skill, no recommendation.</b> A creator with no skill that
 *       helps with any needed task is never shown, however close or well-rated.</li>
 *   <li><b>Recommended</b> only at {@value #RECOMMEND_MIN}% or more.</li>
 *   <li><b>Best match</b> only at {@value #BEST_MATCH_MIN}% or more AND with the
 *       exact skill for at least one must-have task. When nobody reaches that,
 *       there is simply no best match - the bar is never lowered to fill the slot.</li>
 * </ul>
 */
public final class CreatorMatchScorer {

    /** Minimum score to be listed at all. */
    public static final int RECOMMEND_MIN = 45;
    /** Minimum score to be highlighted as the single best match. */
    public static final int BEST_MATCH_MIN = 75;

    /** The five factors. Their weights add up to 100. */
    private static final List<MatchFactor> FACTORS = List.of(
            new PreviousWorkFactor(),
            new SkillsFactor(),
            new LanguageFactor(),
            new ExperienceFactor(),
            new LocationFactor());

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
            long completedJobs,
            List<PastWork> pastWork) {

        /** A creator whose finished jobs are not known (or not needed). */
        public CreatorCandidate(User user, CreatorProfile profile, CreatorApplication application, long completedJobs) {
            this(user, profile, application, completedJobs, List.of());
        }

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
            return SupportedLanguages.ALL.stream()
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
     * @param percentage     0-100
     * @param canDoMustHave  has the exact skill for a must-have task (required for best match)
     * @param canDoTheWork   has some skill that helps with a needed task - without this they are never shown
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
     * @param hasApplied  whether this creator has submitted an application to this opportunity
     * @param elderTrust  the elder's trust from 0 to 1, or null when unknown (see {@link ElderTrustLookup})
     */
    public static Match score(OpportunityNeeds needs, Opportunity opportunity, CreatorCandidate candidate,
                              boolean hasApplied, Double elderTrust) {
        MatchContext context = new MatchContext(needs, opportunity, candidate, elderTrust);

        double points = 0;
        boolean qualifies = true;
        boolean strong = true;
        List<ScoredReason> scored = new ArrayList<>();

        for (MatchFactor factor : FACTORS) {
            FactorScore result = factor.evaluate(context);
            double contribution = factor.weight() * Math.max(0, Math.min(1, result.fraction()));
            points += contribution;
            qualifies &= result.qualifies();
            strong &= result.strong();
            if (result.reason() != null) {
                scored.add(new ScoredReason(result.reason(), contribution));
            }
        }

        // Strongest reason first, so the elder reads the most convincing one at the top.
        scored.sort(Comparator.comparingDouble(ScoredReason::contribution).reversed());
        List<String> reasons = new ArrayList<>();
        if (hasApplied) {
            reasons.add("Has already applied for this opportunity");
        }
        scored.forEach(reason -> reasons.add(reason.text()));

        // Someone who can't do any needed task scores 0 - they must never outrank, or appear beside, real matches.
        int percentage = qualifies ? (int) Math.min(100, Math.round(points)) : 0;
        return new Match(candidate, percentage, qualifies && strong, qualifies, List.copyOf(reasons));
    }

    private record ScoredReason(String text, double contribution) {
    }
}
