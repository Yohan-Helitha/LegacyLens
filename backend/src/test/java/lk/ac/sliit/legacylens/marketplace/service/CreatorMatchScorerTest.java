package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.ExperienceLevel;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.CreatorCandidate;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.Match;
import lk.ac.sliit.legacylens.users.entity.City;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class CreatorMatchScorerTest {

    private static final City MATARA = city(1, "Matara", "Southern");
    private static final City GALLE = city(2, "Galle", "Southern");
    private static final City KANDY = city(3, "Kandy", "Central");
    private static final City MATALE = city(4, "Matale", "Central");
    private static final City PERADENIYA = city(5, "Peradeniya", "Central");
    private static final City COLOMBO = city(6, "Colombo", "Western");
    private static final City SOMEWHERE = city(7, "Somewhere Small", "Uva");
    private static final List<City> CITIES = List.of(MATARA, GALLE, KANDY, MATALE, PERADENIYA, COLOMBO);

    /** An elder with a middling track record - what the algorithm assumes when it cannot tell. */
    private static final double MID_TRUST = 0.5;

    private static City city(int id, String name, String region) {
        City city = new City();
        city.setId(id);
        city.setName(name);
        city.setRegion(region);
        return city;
    }

    private static Opportunity opportunity(String title, String category, String location, String language) {
        Opportunity opportunity = new Opportunity();
        opportunity.setId(UUID.randomUUID());
        opportunity.setTitle(title);
        opportunity.setCategory(category);
        opportunity.setLocation(location);
        opportunity.setLanguage(language);
        opportunity.setLocationType("On-Site");
        return opportunity;
    }

    private static Opportunity food() {
        return opportunity("Traditional recipe documentation", "Food", "Matara, Southern Province", "Sinhala");
    }

    /** A creator with no declared level and no finished jobs - a newcomer. */
    private static CreatorCandidate creator(City city, String skills, String interests, String about, String rating) {
        return creator(city, skills, interests, about, rating, null, 0, List.of(), null);
    }

    private static CreatorCandidate creator(City city, String skills, String interests, String about, String rating,
                                            ExperienceLevel level, long completedJobs, List<PastWork> pastWork,
                                            String experienceDescription) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFullName("Creator");
        user.setCity(city);

        CreatorProfile profile = new CreatorProfile();
        profile.setUser(user);
        profile.setSkills(skills);
        profile.setInterests(interests);
        profile.setRating(rating == null ? null : new BigDecimal(rating));

        CreatorApplication application = new CreatorApplication();
        application.setUser(user);
        application.setAboutYou(about);
        application.setExperienceLevel(level);
        application.setExperienceDescription(experienceDescription);

        return new CreatorCandidate(user, profile, application, completedJobs, pastWork);
    }

    /** Sets the languages the creator ticked on their application, e.g. "Sinhala:FLUENT,English:BASIC". */
    private static CreatorCandidate speaking(CreatorCandidate creator, String languages) {
        creator.application().setLanguages(languages);
        return creator;
    }

    private static List<PastWork> foodJobs(int count) {
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(i -> new PastWork("Recipe film " + i, "Filmed a traditional recipe", "Food"))
                .toList();
    }

    private static Match score(Opportunity opportunity, CreatorCandidate creator) {
        return score(opportunity, creator, MID_TRUST);
    }

    private static Match score(Opportunity opportunity, CreatorCandidate creator, Double trust) {
        return CreatorMatchScorer.score(OpportunityNeedsAnalyser.analyse(opportunity, CITIES), opportunity, creator, false, trust);
    }

    private static MatchContext context(Opportunity opportunity, CreatorCandidate creator, Double trust) {
        return new MatchContext(OpportunityNeedsAnalyser.analyse(opportunity, CITIES), opportunity, creator, trust);
    }

    // ── What the opportunity needs ──────────────────────────────────────────

    @Test
    void danceEvent_needsAVideographer() {
        OpportunityNeeds needs = OpportunityNeedsAnalyser.analyse(
                opportunity("Kandyan dance at the village temple", "Dance", "Kandy", null), CITIES);

        assertThat(needs.topics()).first().isEqualTo(ContentTopic.DANCE);
        assertThat(needs.mustHave()).containsExactly(CreatorSkill.VIDEOGRAPHY);
        assertThat(needs.helpful()).containsExactly(CreatorSkill.PHOTOGRAPHY);
        assertThat(needs.city()).isSameAs(KANDY);
    }

    @Test
    void storytelling_needsSomeoneWhoInterviewsOrRecords() {
        OpportunityNeeds needs = OpportunityNeedsAnalyser.analyse(
                opportunity("Interviewing a war veteran about his memories", "Folk Knowledge", null, null), CITIES);

        assertThat(needs.topics()).first().isEqualTo(ContentTopic.STORY);
        assertThat(needs.mustHave()).contains(CreatorSkill.INTERVIEWING, CreatorSkill.VIDEOGRAPHY, CreatorSkill.AUDIO);
    }

    @Test
    void theWordTraditional_doesNotTurnARecipeIntoARitual() {
        OpportunityNeeds needs = OpportunityNeedsAnalyser.analyse(
                opportunity("Traditional recipe documentation", "Food", "Matara", null), CITIES);

        assertThat(needs.topics()).containsExactly(ContentTopic.FOOD);
    }

    @Test
    void adminRequiredSkills_overrideWhatTheWordsSuggest() {
        Opportunity opp = opportunity("Kandyan dance at the village temple", "Dance", "Kandy", null);
        opp.setRequiredSkills("Photography,Translation (Sinhala/English)");

        OpportunityNeeds needs = OpportunityNeedsAnalyser.analyse(opp, CITIES);

        assertThat(needs.fromAdmin()).isTrue();
        assertThat(needs.mustHave()).containsExactlyInAnyOrder(CreatorSkill.PHOTOGRAPHY, CreatorSkill.TRANSLATION);
    }

    // ── The five weights ────────────────────────────────────────────────────

    @Test
    void theFiveWeights_addUpToOneHundred() {
        assertThat(PreviousWorkFactor.WEIGHT + SkillsFactor.WEIGHT + LanguageFactor.WEIGHT
                + ExperienceFactor.WEIGHT + LocationFactor.WEIGHT).isEqualTo(100);
        assertThat(PreviousWorkFactor.WEIGHT).isEqualTo(30);
        assertThat(SkillsFactor.WEIGHT).isEqualTo(25);
        assertThat(LanguageFactor.WEIGHT).isEqualTo(20);
        assertThat(ExperienceFactor.WEIGHT).isEqualTo(15);
        assertThat(LocationFactor.WEIGHT).isEqualTo(10);
    }

    // ── Whole-score examples (worked out by hand) ───────────────────────────

    @Test
    void strongFit_isBestMatch_withEveryReasonExplained_strongestFirst() {
        CreatorCandidate nimal = speaking(creator(MATARA, "Videography, Photography", "Traditional Foods",
                null, "4.8", ExperienceLevel.EXPERIENCED, 24, foodJobs(3), null), "Sinhala:FLUENT,English:BASIC");

        Match match = score(food(), nimal);

        assertThat(match.reasons()).containsExactly(
                "Has completed 3 similar jobs on LegacyLens",
                "Skilled in Videography - needed for this traditional food",
                "Speaks Sinhala (fluent)",
                "Experienced content creator",
                "Lives in Matara, where this takes place");
        // previous work 0.90x30 + skills 1.0x25 + language 1.0x20 + experience 1.0x15 + location 1.0x10 = 97
        assertThat(match.percentage()).isEqualTo(97);
        assertThat(match.bestMatchWorthy()).isTrue();
    }

    @Test
    void newcomerFarAway_withNoHistory_isStillRecommended_butNotBestMatch() {
        CreatorCandidate newcomer = speaking(creator(KANDY, "Videography", null, null, null), "Sinhala:INTERMEDIATE");

        Match match = score(food(), newcomer);

        // previous work 0.10x30 = 3, skills (1.0 + 0.7 close)/2 x25 = 21.25, intermediate Sinhala 0.7x20 = 14,
        // experience new creator at middling trust 0.6x15 = 9, location ~150 km 0.2x10 = 2  ->  49.25
        assertThat(match.percentage()).isEqualTo(49);
        assertThat(match.recommendable()).isTrue();
        assertThat(match.bestMatchWorthy()).isFalse();
    }

    @Test
    void creatorWhoCannotDoTheTask_isNeverRecommended_evenIfLocalAndTopRated() {
        Opportunity dance = opportunity("Kandyan dance performance", "Dance", "Kandy", "Sinhala");
        CreatorCandidate localWriter = creator(KANDY, "Script Writing", "Traditional Dance",
                "I speak Sinhala", "5.0", ExperienceLevel.EXPERIENCED, 30, List.of(), null);

        Match match = score(dance, localWriter);

        assertThat(match.canDoTheWork()).isFalse();
        assertThat(match.percentage()).isZero();
        assertThat(match.recommendable()).isFalse();
    }

    @Test
    void sameCreator_fitsOneOpportunityButNotAnother() {
        CreatorCandidate photographer = creator(KANDY, "Photography", null, null, null);

        Match craft = score(opportunity("Mask carving workshop", "Craft", "Kandy", null), photographer);
        Match language = score(opportunity("Old village words and proverbs", "Language", "Kandy", null), photographer);

        assertThat(craft.canDoMustHave()).isTrue();
        assertThat(language.canDoTheWork()).isFalse();
    }

    @Test
    void closeSkill_earnsPartialCredit_butNeverTheBestMatch() {
        Opportunity dance = opportunity("Kandyan dance performance", "Dance", "Kandy", "Sinhala");
        List<PastWork> danceJobs = java.util.stream.IntStream.range(0, 3)
                .mapToObj(i -> new PastWork("Dance show " + i, "Photographed a Kandyan dance", "Dance")).toList();
        CreatorCandidate photographer = speaking(creator(KANDY, "Photography", null, null, "5.0",
                ExperienceLevel.EXPERIENCED, 3, danceJobs, null), "Sinhala:FLUENT");

        Match match = score(dance, photographer);

        // 0.9x30 + 0.7x25 (a photographer for a filming job) + 20 + 15 + 10 = 89.5
        assertThat(match.percentage()).isEqualTo(90);
        assertThat(match.recommendable()).isTrue();
        assertThat(match.canDoMustHave()).isFalse();
        assertThat(match.bestMatchWorthy()).isFalse();
        assertThat(match.reasons()).contains("Has Photography, which is close to the videography this needs");
    }

    @Test
    void unknownNeed_canBeRecommendedButNeverBestMatch() {
        Opportunity vague = opportunity("Help needed", null, "Matara", "Sinhala");
        vague.setLocationType("Remote OK");
        CreatorCandidate everything = speaking(creator(MATARA, "Videography, Photography", "Traditional Foods",
                null, "5.0", null, 50, List.of(), null), "Sinhala:FLUENT");

        Match match = score(vague, everything);

        // previous work 0.10x30 + any skill 0.5x25 + language 20 + experienced (50 jobs) 15 + remote 10 = 60.5
        assertThat(match.percentage()).isEqualTo(61);
        assertThat(match.recommendable()).isTrue();
        assertThat(match.bestMatchWorthy()).isFalse();
    }

    @Test
    void anElderWithTrust_makesNewcomersMoreCompetitive() {
        CreatorCandidate newcomer = speaking(creator(MATARA, "Videography, Photography", null, null, null), "Sinhala:FLUENT");

        int trusted = score(food(), newcomer, 1.0).percentage();
        int untrusted = score(food(), newcomer, 0.0).percentage();

        // a new creator earns 0.9 of the experience points with a fully trusted elder, 0.3 with a brand-new one
        assertThat(trusted - untrusted).isEqualTo(9);
    }

    // ── Previous relevant work (30) ─────────────────────────────────────────

    @Test
    void previousWork_growsWithEachSimilarJob_butNoHistoryIsNotZero() {
        PreviousWorkFactor factor = new PreviousWorkFactor();
        Opportunity food = food();

        double none = factor.evaluate(context(food, creator(MATARA, "Videography", null, null, null), MID_TRUST)).fraction();
        double one = factor.evaluate(context(food, withJobs(foodJobs(1)), MID_TRUST)).fraction();
        double two = factor.evaluate(context(food, withJobs(foodJobs(2)), MID_TRUST)).fraction();
        double three = factor.evaluate(context(food, withJobs(foodJobs(3)), MID_TRUST)).fraction();
        double many = factor.evaluate(context(food, withJobs(foodJobs(9)), MID_TRUST)).fraction();

        assertThat(none).isCloseTo(0.10, within(1e-9));
        assertThat(one).isCloseTo(0.55, within(1e-9));
        assertThat(two).isCloseTo(0.75, within(1e-9));
        assertThat(three).isCloseTo(0.90, within(1e-9));
        assertThat(many).isCloseTo(0.90, within(1e-9));
    }

    @Test
    void previousWork_inAnotherSubject_butUsingTheSameSkill_isSomewhatRelated() {
        List<PastWork> danceFilms = List.of(new PastWork("Temple dance", "Video of a dance", "Dance"));

        double fraction = new PreviousWorkFactor()
                .evaluate(context(food(), withJobs(danceFilms), MID_TRUST)).fraction();

        assertThat(fraction).isCloseTo(0.35, within(1e-9));
    }

    @Test
    void previousWork_unrelatedToTheOpportunity_countsForLittle() {
        List<PastWork> unrelated = List.of(new PastWork("Bank leaflet", "Printed brochure", "Corporate"));

        double fraction = new PreviousWorkFactor()
                .evaluate(context(food(), withJobs(unrelated), MID_TRUST)).fraction();

        assertThat(fraction).isCloseTo(0.10, within(1e-9));
    }

    @Test
    void selfDescribedExperience_countsAsRelatedWork_butNeverAsProvenWork() {
        CreatorCandidate writer = creator(MATARA, "Videography", null, null, null, null, 0, List.of(),
                "Filmed traditional recipes for a village cooking club");

        double fraction = new PreviousWorkFactor().evaluate(context(food(), writer, MID_TRUST)).fraction();

        assertThat(fraction).isCloseTo(0.35, within(1e-9));
    }

    private static CreatorCandidate withJobs(List<PastWork> work) {
        return creator(MATARA, "Videography", null, null, null, null, work.size(), work, null);
    }

    // ── Skills (25) ─────────────────────────────────────────────────────────

    @Test
    void skills_exactCountsInFull_closeSeventyPercent_somewhatFortyPercent_unrelatedNothing() {
        Opportunity translation = opportunity("Translate old letters", "Language", "Kandy", null);
        translation.setRequiredSkills("Translation");
        SkillsFactor factor = new SkillsFactor();

        double exact = factor.evaluate(context(translation, creator(KANDY, "Translation", null, null, null), MID_TRUST)).fraction();
        double close = factor.evaluate(context(translation, creator(KANDY, "Script Writing", null, null, null), MID_TRUST)).fraction();
        double somewhat = factor.evaluate(context(translation, creator(KANDY, "Interviewing", null, null, null), MID_TRUST)).fraction();
        double unrelated = factor.evaluate(context(translation, creator(KANDY, "Photography", null, null, null), MID_TRUST)).fraction();

        assertThat(exact).isCloseTo(1.0, within(1e-9));
        assertThat(close).isCloseTo(0.7, within(1e-9));
        assertThat(somewhat).isCloseTo(0.4, within(1e-9));
        assertThat(unrelated).isZero();
    }

    @Test
    void skills_areAveragedOverEveryNeededSkill() {
        // Food needs both filming and photographing: a photographer has one exactly and the other closely.
        double fraction = new SkillsFactor()
                .evaluate(context(food(), creator(KANDY, "Photography", null, null, null), MID_TRUST)).fraction();

        assertThat(fraction).isCloseTo(0.85, within(1e-9));
    }

    // ── Language (20) ───────────────────────────────────────────────────────

    @Test
    void language_creditFollowsHowWellTheCreatorSpeaksIt() {
        LanguageFactor factor = new LanguageFactor();
        Opportunity sinhala = opportunity("Recipe", "Food", "Matara", "Sinhala");

        assertThat(languageFraction(factor, sinhala, "Sinhala:FLUENT")).isEqualTo(1.0);
        assertThat(languageFraction(factor, sinhala, "Sinhala:INTERMEDIATE")).isEqualTo(0.7);
        assertThat(languageFraction(factor, sinhala, "Sinhala:BASIC")).isEqualTo(0.4);
    }

    @Test
    void language_aCreatorWhoListsOnlyOtherLanguages_getsNothing() {
        Opportunity sinhala = opportunity("Recipe", "Food", "Matara", "Sinhala");

        assertThat(languageFraction(new LanguageFactor(), sinhala, "English:FLUENT,Tamil:FLUENT")).isZero();
    }

    @Test
    void language_whenSeveralAreAccepted_theBestOneCounts() {
        Opportunity either = opportunity("Recipe", "Food", "Matara", "Sinhala / English");

        assertThat(languageFraction(new LanguageFactor(), either, "Sinhala:BASIC,English:FLUENT")).isEqualTo(1.0);
    }

    @Test
    void language_reasonSaysHowWellTheyWillSpeakIt() {
        Opportunity sinhala = opportunity("Recipe", "Food", "Matara", "Sinhala");
        CreatorCandidate creator = speaking(creator(MATARA, "Videography", null, null, null), "Sinhala:INTERMEDIATE");

        FactorScore score = new LanguageFactor().evaluate(context(sinhala, creator, MID_TRUST));

        assertThat(score.reason()).isEqualTo("Speaks Sinhala (intermediate)");
    }

    @Test
    void language_nothingIsAssumed_aLanguageOnlyMentionedInTextOrNeverDeclaredScoresZero() {
        LanguageFactor factor = new LanguageFactor();
        Opportunity sinhala = opportunity("Recipe", "Food", "Matara", "Sinhala");

        // writes about speaking Sinhala in their free text but never declared it
        double mentioned = factor.evaluate(context(sinhala, creator(MATARA, "Videography", null, "I speak Sinhala", null), MID_TRUST)).fraction();
        // applied before languages were asked: nothing declared at all
        double nothing = factor.evaluate(context(sinhala, creator(MATARA, "Videography", null, null, null), MID_TRUST)).fraction();

        assertThat(mentioned).isZero();
        assertThat(nothing).isZero();
    }

    @Test
    void language_noRequirement_costsNobodyAnything() {
        Opportunity anyLanguage = opportunity("Recipe", "Food", "Matara", null);

        double fraction = new LanguageFactor()
                .evaluate(context(anyLanguage, creator(MATARA, "Videography", null, null, null), MID_TRUST)).fraction();

        assertThat(fraction).isEqualTo(1.0);
    }

    private static double languageFraction(LanguageFactor factor, Opportunity opportunity, String languages) {
        CreatorCandidate creator = speaking(creator(MATARA, "Videography", null, null, null), languages);
        return factor.evaluate(context(opportunity, creator, MID_TRUST)).fraction();
    }

    // ── Experience (15) ─────────────────────────────────────────────────────

    @Test
    void experience_slidesWithTheEldersTrust() {
        ExperienceFactor factor = new ExperienceFactor();
        Opportunity food = food();
        CreatorCandidate newcomer = creator(MATARA, "Videography", null, null, null, ExperienceLevel.NEW_TO_DOCUMENTATION, 0, List.of(), null);
        CreatorCandidate some = creator(MATARA, "Videography", null, null, null, ExperienceLevel.SOME_EXPERIENCE, 0, List.of(), null);
        CreatorCandidate expert = creator(MATARA, "Videography", null, null, null, ExperienceLevel.EXPERIENCED, 0, List.of(), null);

        assertThat(factor.evaluate(context(food, newcomer, 0.0)).fraction()).isCloseTo(0.3, within(1e-9));
        assertThat(factor.evaluate(context(food, newcomer, 1.0)).fraction()).isCloseTo(0.9, within(1e-9));
        assertThat(factor.evaluate(context(food, some, 0.0)).fraction()).isCloseTo(0.7, within(1e-9));
        assertThat(factor.evaluate(context(food, some, 1.0)).fraction()).isCloseTo(0.9, within(1e-9));
        assertThat(factor.evaluate(context(food, expert, 0.0)).fraction()).isCloseTo(1.0, within(1e-9));
        assertThat(factor.evaluate(context(food, expert, 1.0)).fraction()).isCloseTo(1.0, within(1e-9));
    }

    @Test
    void experience_whenTheElderIsUnknown_assumesMiddlingTrust() {
        CreatorCandidate newcomer = creator(MATARA, "Videography", null, null, null, ExperienceLevel.NEW_TO_DOCUMENTATION, 0, List.of(), null);

        double fraction = new ExperienceFactor().evaluate(context(food(), newcomer, null)).fraction();

        assertThat(fraction).isCloseTo(0.6, within(1e-9));
    }

    @Test
    void experience_isRaisedByWorkActuallyCompletedHere() {
        ExperienceFactor factor = new ExperienceFactor();
        CreatorCandidate declaredNew = creator(MATARA, "Videography", null, null, null, ExperienceLevel.NEW_TO_DOCUMENTATION, 5, List.of(), null);
        CreatorCandidate oneJob = creator(MATARA, "Videography", null, null, null, ExperienceLevel.NEW_TO_DOCUMENTATION, 1, List.of(), null);

        assertThat(factor.evaluate(context(food(), declaredNew, 0.0)).fraction()).isCloseTo(1.0, within(1e-9));
        assertThat(factor.evaluate(context(food(), oneJob, 0.0)).fraction()).isCloseTo(0.7, within(1e-9));
    }

    // ── Location (10) ───────────────────────────────────────────────────────

    @Test
    void location_isJudgedByDistance_notJustSameCityOrNot() {
        LocationFactor factor = new LocationFactor();
        Opportunity inKandy = opportunity("Mask carving", "Craft", "Kandy", null);

        assertThat(fractionIn(factor, inKandy, KANDY)).isEqualTo(1.0);          // same city
        assertThat(fractionIn(factor, inKandy, PERADENIYA)).isEqualTo(1.0);     // ~6 km
        assertThat(fractionIn(factor, inKandy, MATALE)).isEqualTo(0.8);         // ~20 km
        assertThat(fractionIn(factor, inKandy, COLOMBO)).isEqualTo(0.4);        // ~94 km
        assertThat(fractionIn(factor, inKandy, MATARA)).isEqualTo(0.2);         // ~150 km
        assertThat(fractionIn(factor, opportunity("Recipe", "Food", "Matara", null), GALLE)).isEqualTo(0.6); // ~39 km
    }

    @Test
    void location_nearbyCreatorGetsADistanceReason() {
        Opportunity food = opportunity("Recipe", "Food", "Matara", null);

        FactorScore score = new LocationFactor().evaluate(context(food, creator(GALLE, "Videography", null, null, null), MID_TRUST));

        assertThat(score.reason()).matches("Lives about \\d+ km away in Galle");
    }

    @Test
    void location_remoteWorkIsFullMarksForEveryone() {
        Opportunity words = opportunity("Old fishing terms and sayings", "Language", "Matara", null);
        words.setLocationType("Remote OK");

        FactorScore score = new LocationFactor().evaluate(context(words, creator(KANDY, "Transcription", null, null, null), MID_TRUST));

        assertThat(score.fraction()).isEqualTo(1.0);
        assertThat(score.reason()).isEqualTo("Can work on this remotely");
    }

    @Test
    void location_unknownTownsFallBackToTheProvince_andUnknownLocationsAreCautious() {
        LocationFactor factor = new LocationFactor();
        City unlistedSouth = city(8, "Tiny Southern Village", "Southern");
        City unlistedElsewhere = city(9, "Other Hamlet", "Uva");
        Opportunity food = opportunity("Recipe", "Food", "Matara", null);

        // Matara is listed but the creator's village is not, so the two provinces are compared.
        assertThat(fractionIn(factor, food, unlistedSouth)).isEqualTo(0.6);
        assertThat(fractionIn(factor, food, unlistedElsewhere)).isEqualTo(0.2);
        // A creator with no city at all.
        assertThat(factor.evaluate(context(food, creator(null, "Videography", null, null, null), MID_TRUST)).fraction()).isEqualTo(0.4);
        assertThat(fractionIn(factor, opportunity("Recipe", "Food", null, null), SOMEWHERE)).isEqualTo(0.4);
    }

    private static double fractionIn(LocationFactor factor, Opportunity opportunity, City creatorCity) {
        return factor.evaluate(context(opportunity, creator(creatorCity, "Videography", null, null, null), MID_TRUST)).fraction();
    }

    // ── Distance between towns ──────────────────────────────────────────────

    @Test
    void townDistances_areRoughlyRight() {
        assertThat(CityDistance.kilometres("Colombo", "Kandy").orElseThrow()).isBetween(90.0, 98.0);
        assertThat(CityDistance.kilometres("Galle", "Matara").orElseThrow()).isBetween(35.0, 42.0);
        assertThat(CityDistance.kilometres("Colombo 07", "Colombo").orElseThrow()).isZero();
        // straight-line, not by road
        assertThat(CityDistance.kilometres("Nuwara Eliya", "Kandy").orElseThrow()).isBetween(38.0, 45.0);
        assertThat(CityDistance.kilometres("Unknown Place", "Kandy")).isEmpty();
    }

    // ── Keyword matching ────────────────────────────────────────────────────

    @Test
    void stems_onlyMatchAtTheStartOfAWord() {
        assertThat(TextMatching.containsStem("photography walk", "photo")).isTrue();
        assertThat(TextMatching.containsStem("birthday party", "art")).isFalse();
        assertThat(TextMatching.containsStem("teaching children", "tea estate")).isFalse();
    }

    @Test
    void creatorLanguages_comeOnlyFromWhatTheyDeclared() {
        CreatorCandidate declared = speaking(creator(null, "Translation", "Tamil folklore", "Fluent in ENGLISH", null),
                "Tamil:FLUENT,English:BASIC");
        CreatorCandidate onlyWrittenAbout = creator(null, "Translation", "Tamil folklore", "Fluent in ENGLISH", null);

        assertThat(declared.languages()).containsExactly("Tamil", "English");
        assertThat(onlyWrittenAbout.languages()).isEmpty();
    }
}
