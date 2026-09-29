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
import java.util.regex.Pattern;

/**
 * Matches content creators to an elder's opportunity for the Content
 * Creator Recommendation screen.
 *
 * <h2>1. What does the opportunity need?</h2>
 * Different opportunities need different creators — a dance performance needs
 * someone who films, a craft needs someone who photographs, an old story needs
 * someone who interviews and records. {@link #analyse} works this out:
 * <ul>
 *   <li>The admin's own "Required Skills" (Opportunity.requiredSkills) win when
 *       set — they are exactly what the job needs.</li>
 *   <li>Otherwise the need is inferred from the category, title, description,
 *       preservation goal and tasks using the {@link Topic} table below.</li>
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
    // Creator skills
    // ─────────────────────────────────────────────────────────────────────────

    /** A kind of work a creator can do. Recognised from free-text skill tags via stems. */
    public enum Skill {
        VIDEOGRAPHY("videography", "video", "videograph", "film", "cinematograph", "camera operat", "drone", "youtube", "editing"),
        PHOTOGRAPHY("photography", "photo", "camera", "portrait"),
        AUDIO("audio recording", "audio", "sound", "podcast", "recording", "voice"),
        WRITING("writing", "writ", "script", "transcri", "article", "blog", "journal", "documentation", "copy"),
        INTERVIEWING("interviewing", "interview", "oral history", "storytell", "research", "reporter"),
        TRANSLATION("translation", "translat", "interpret");

        final String label;
        private final List<String> stems;

        Skill(String label, String... stems) {
            this.label = label;
            this.stems = List.of(stems);
        }

        boolean matches(String lowerText) {
            return stems.stream().anyMatch(stem -> containsStem(lowerText, stem));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // What an opportunity is about → which skills it needs
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Opportunity topics, each with the words that reveal it, the creator skills
     * it MUST have, skills that merely help, and creator interests that show a
     * real interest in the subject.
     */
    public enum Topic {
        DANCE("dance performance",
                List.of("dance", "dancing", "dancer", "kandyan", "performance", "drama", "theatre"),
                EnumSet.of(Skill.VIDEOGRAPHY), EnumSet.of(Skill.PHOTOGRAPHY),
                List.of("dance", "perform", "drama")),
        MUSIC("music tradition",
                List.of("music", "song", "singing", "singer", "drum", "instrument", "chant", "melody", "raban"),
                EnumSet.of(Skill.VIDEOGRAPHY, Skill.AUDIO), EnumSet.of(Skill.PHOTOGRAPHY),
                List.of("music", "song", "drum")),
        FOOD("traditional food",
                List.of("food", "recipe", "cook", "cuisine", "dish", "kitchen", "sweet", "kavum", "curry", "meal"),
                EnumSet.of(Skill.VIDEOGRAPHY, Skill.PHOTOGRAPHY), EnumSet.of(Skill.WRITING),
                List.of("food", "cook", "culinar", "recipe", "cuisine")),
        RITUAL("ritual or festival",
                // Not "tradition" — as a prefix it would also catch "traditional", which describes
                // nearly every opportunity (the "Tradition" category is mapped in CATEGORY_TOPICS instead).
                List.of("ritual", "festival", "perahera", "ceremony", "celebrat", "pooja", "puja", "new year",
                        "avurudu", "wedding"),
                EnumSet.of(Skill.VIDEOGRAPHY, Skill.PHOTOGRAPHY), EnumSet.of(Skill.INTERVIEWING),
                List.of("ritual", "festival", "tradition", "culture", "heritage")),
        CRAFT("traditional craft",
                List.of("craft", "pottery", "potter", "weav", "mask", "carv", "handloom", "lacquer", "artisan",
                        "batik", "brass", "jewell", "basket"),
                EnumSet.of(Skill.PHOTOGRAPHY, Skill.VIDEOGRAPHY), EnumSet.of(Skill.WRITING),
                List.of("craft", "art", "pottery", "weav", "mask")),
        STORY("story or oral history",
                List.of("story", "stories", "storytell", "oral history", "folklore", "folk", "legend", "memories",
                        "veteran", "histor", "childhood"),
                EnumSet.of(Skill.INTERVIEWING, Skill.VIDEOGRAPHY, Skill.AUDIO), EnumSet.of(Skill.WRITING),
                List.of("histor", "folk", "story", "stories", "heritage", "legend")),
        LANGUAGE("language or local words",
                List.of("language", "word", "terms", "dialect", "vocabular", "proverb", "saying", "glossary"),
                EnumSet.of(Skill.WRITING, Skill.TRANSLATION), EnumSet.of(Skill.AUDIO, Skill.VIDEOGRAPHY),
                List.of("language", "linguist", "literature")),
        LIVELIHOOD("fishing or farming tradition",
                List.of("fish", "boat", "stilt", "agricultur", "farm", "paddy", "harvest", "cultivat", "tea estate",
                        "tea plant"),
                EnumSet.of(Skill.VIDEOGRAPHY, Skill.PHOTOGRAPHY), EnumSet.of(Skill.WRITING),
                List.of("fish", "agricultur", "farm", "rural", "village"));

        final String label;
        private final List<String> signals;
        final Set<Skill> mustHave;
        final Set<Skill> helpful;
        private final List<String> interestStems;

        Topic(String label, List<String> signals, Set<Skill> mustHave, Set<Skill> helpful, List<String> interestStems) {
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

    /**
     * What one opportunity needs, worked out once and reused for every creator.
     *
     * @param mustHave    skills the job cannot be done without (at least one must be covered)
     * @param helpful     skills that add value but can't carry the job alone
     * @param topics      what the opportunity is about — drives the interest points
     * @param fromAdmin   true when mustHave came from the admin's Required Skills
     * @param unknownNeed true when nothing could be inferred — any skill earns partial credit only
     * @param city        the opportunity's city, when its location names a known city
     * @param remote      true for "Remote OK" opportunities — location stops mattering
     */
    public record OpportunityNeeds(
            Set<Skill> mustHave,
            Set<Skill> helpful,
            List<Topic> topics,
            boolean fromAdmin,
            boolean unknownNeed,
            City city,
            boolean remote) {
    }

    /** The admin's "Preservation Category" chips (see CreateOpportunityScreen) → topic, when the words alone don't reveal it. */
    private static final Map<String, Topic> CATEGORY_TOPICS = Map.of(
            "craft", Topic.CRAFT,
            "food", Topic.FOOD,
            "language", Topic.LANGUAGE,
            "tradition", Topic.RITUAL,
            "music", Topic.MUSIC,
            "dance", Topic.DANCE,
            "agriculture", Topic.LIVELIHOOD,
            "ritual", Topic.RITUAL,
            "folk knowledge", Topic.STORY);

    /** Admin "Required Skills" labels (see CreateOpportunityScreen) → creator skills. */
    private static final Map<String, Skill> ADMIN_SKILLS = Map.of(
            "photography", Skill.PHOTOGRAPHY,
            "videography", Skill.VIDEOGRAPHY,
            "documentation", Skill.WRITING,
            "translation", Skill.TRANSLATION,
            "interviews", Skill.INTERVIEWING);

    /** Works out what the opportunity needs. {@code cities} resolves its location to a city/province. */
    public static OpportunityNeeds analyse(Opportunity opportunity, List<City> cities) {
        String text = String.join(" ",
                nullToEmpty(opportunity.getCategory()),
                nullToEmpty(opportunity.getTitle()),
                nullToEmpty(opportunity.getDescription()),
                nullToEmpty(opportunity.getPreservationGoal()),
                nullToEmpty(opportunity.getTasks())).toLowerCase(Locale.ROOT);

        // The admin's category is the most deliberate signal, so its topic leads (it also names the topic in reasons).
        Set<Topic> found = new LinkedHashSet<>();
        Topic categoryTopic = CATEGORY_TOPICS.get(nullToEmpty(opportunity.getCategory()).trim().toLowerCase(Locale.ROOT));
        if (categoryTopic != null) {
            found.add(categoryTopic);
        }
        for (Topic topic : Topic.values()) {
            if (topic.mentionedIn(text)) {
                found.add(topic);
            }
        }
        List<Topic> topics = new ArrayList<>(found);

        Set<Skill> mustHave = EnumSet.noneOf(Skill.class);
        Set<Skill> helpful = EnumSet.noneOf(Skill.class);

        Set<Skill> adminSkills = adminRequiredSkills(opportunity.getRequiredSkills());
        boolean fromAdmin = !adminSkills.isEmpty();
        if (fromAdmin) {
            mustHave.addAll(adminSkills);
            topics.forEach(topic -> helpful.addAll(topic.helpful));
        } else {
            topics.forEach(topic -> {
                mustHave.addAll(topic.mustHave);
                helpful.addAll(topic.helpful);
            });
            // An explicit ask in the opportunity's own words always makes that skill a must-have.
            if (containsStem(text, "photograph") || containsStem(text, "photo")) mustHave.add(Skill.PHOTOGRAPHY);
            if (containsStem(text, "video") || containsStem(text, "film")) mustHave.add(Skill.VIDEOGRAPHY);
            if (containsStem(text, "interview")) mustHave.add(Skill.INTERVIEWING);
            if (containsStem(text, "transcri") || containsStem(text, "article")) mustHave.add(Skill.WRITING);
            if (containsStem(text, "translat")) mustHave.add(Skill.TRANSLATION);
        }
        helpful.removeAll(mustHave);

        String locationType = nullToEmpty(opportunity.getLocationType()).toLowerCase(Locale.ROOT);
        boolean remote = locationType.contains("remote");

        return new OpportunityNeeds(
                mustHave, helpful, List.copyOf(topics), fromAdmin, mustHave.isEmpty(),
                resolveCity(opportunity.getLocation(), cities), remote);
    }

    private static Set<Skill> adminRequiredSkills(String requiredSkills) {
        Set<Skill> skills = EnumSet.noneOf(Skill.class);
        for (String tag : splitTags(requiredSkills)) {
            String lower = tag.toLowerCase(Locale.ROOT);
            ADMIN_SKILLS.entrySet().stream()
                    .filter(entry -> lower.startsWith(entry.getKey()))
                    .findFirst()
                    .map(Map.Entry::getValue)
                    .or(() -> matchSkill(lower))
                    .ifPresent(skills::add);
        }
        return skills;
    }

    private static Optional<Skill> matchSkill(String lowerTag) {
        for (Skill skill : Skill.values()) {
            if (skill.matches(lowerTag)) {
                return Optional.of(skill);
            }
        }
        return Optional.empty();
    }

    /** The known city named in a free-text location — longest name first, so "Nuwara Eliya" beats "Eliya". */
    static City resolveCity(String location, List<City> cities) {
        if (location == null || location.isBlank() || cities == null) {
            return null;
        }
        String lower = location.toLowerCase(Locale.ROOT);
        return cities.stream()
                .filter(city -> city.getName() != null && !city.getName().isBlank())
                .sorted(Comparator.comparingInt((City city) -> city.getName().length()).reversed())
                .filter(city -> containsStem(lower, city.getName().toLowerCase(Locale.ROOT)))
                .findFirst()
                .orElse(null);
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

        /** Skill tags from the verified profile and the creator application, de-duplicated. */
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
        Map<Skill, String> skillEvidence() {
            Map<Skill, String> evidence = new LinkedHashMap<>();
            for (String tag : skills()) {
                String lower = tag.toLowerCase(Locale.ROOT);
                for (Skill skill : Skill.values()) {
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
        Map<Skill, String> evidence = candidate.skillEvidence();

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
            for (Skill skill : needs.mustHave()) {
                if (evidence.containsKey(skill)) mustHaveTags.add(evidence.get(skill));
            }
            List<String> helpfulTags = new ArrayList<>();
            for (Skill skill : needs.helpful()) {
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
        for (Topic topic : needs.topics()) {
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

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
