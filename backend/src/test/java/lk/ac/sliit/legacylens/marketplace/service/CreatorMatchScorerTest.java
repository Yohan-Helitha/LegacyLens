package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
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

class CreatorMatchScorerTest {

    private static final City MATARA = city(1, "Matara", "Southern");
    private static final City GALLE = city(2, "Galle", "Southern");
    private static final City KANDY = city(3, "Kandy", "Central");
    private static final List<City> CITIES = List.of(MATARA, GALLE, KANDY);

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

    private static CreatorCandidate creator(City city, String skills, String interests, String about,
                                            String rating, long completedJobs) {
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

        return new CreatorCandidate(user, profile, application, completedJobs);
    }

    private static Match score(Opportunity opportunity, CreatorCandidate creator) {
        return CreatorMatchScorer.score(OpportunityNeedsAnalyser.analyse(opportunity, CITIES), opportunity, creator, false);
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

    // ── Different creators for different tasks ──────────────────────────────

    @Test
    void creatorWhoCannotDoTheTask_isNeverRecommended_evenIfLocalAndTopRated() {
        Opportunity dance = opportunity("Kandyan dance performance", "Dance", "Kandy", "Sinhala");
        CreatorCandidate localWriter = creator(KANDY, "Script Writing", "Traditional Dance",
                "I speak Sinhala", "5.0", 30);

        Match match = score(dance, localWriter);

        assertThat(match.canDoTheWork()).isFalse();
        assertThat(match.percentage()).isZero();
        assertThat(match.recommendable()).isFalse();
    }

    @Test
    void sameCreator_fitsOneOpportunityButNotAnother() {
        CreatorCandidate photographer = creator(KANDY, "Photography", null, null, null, 0);

        Match craft = score(opportunity("Mask carving workshop", "Craft", "Kandy", null), photographer);
        Match language = score(opportunity("Old village words and proverbs", "Language", "Kandy", null), photographer);

        assertThat(craft.canDoMustHave()).isTrue();
        assertThat(language.canDoTheWork()).isFalse();
    }

    // ── Best match vs recommendation vs not shown ───────────────────────────

    @Test
    void strongFit_isBestMatch_withEveryReasonExplained() {
        Opportunity food = opportunity("Traditional recipe documentation", "Food", "Matara, Southern Province", "Sinhala");
        CreatorCandidate nimal = creator(MATARA, "Videography, Photography", "Traditional Foods",
                "I speak Sinhala and English", "4.8", 24);

        Match match = score(food, nimal);

        assertThat(match.reasons()).containsExactly(
                "Skilled in Videography — needed for this traditional food",
                "Can also help with Photography",
                "Interested in Traditional Foods",
                "Lives in Matara, where this takes place",
                "Speaks Sinhala",
                "Highly rated by other elders (4.8 stars)",
                "Has completed 24 jobs on LegacyLens");
        // 45 must-have + 10 extra + 15 topic + 15 city + 10 language + 3 rating + 2 jobs = 100
        assertThat(match.percentage()).isEqualTo(100);
        assertThat(match.bestMatchWorthy()).isTrue();
    }

    @Test
    void canDoTheTaskButNothingElse_isRecommendedButNotBestMatch() {
        Opportunity food = opportunity("Traditional recipe documentation", "Food", "Matara", "Sinhala");
        CreatorCandidate farAway = creator(KANDY, "Videography", null, null, null, 0);

        Match match = score(food, farAway);

        assertThat(match.percentage()).isEqualTo(45);
        assertThat(match.recommendable()).isTrue();
        assertThat(match.bestMatchWorthy()).isFalse();
    }

    @Test
    void weakMatch_isNotShownAtAll_ratherThanPaddingTheList() {
        Opportunity food = opportunity("Traditional recipe documentation", "Food", "Matara", null);
        // Only a helpful skill (writing), far away, no interest: 20 points — well below the bar.
        CreatorCandidate writer = creator(KANDY, "Script Writing", null, null, null, 0);

        Match match = score(food, writer);

        assertThat(match.canDoTheWork()).isTrue();
        assertThat(match.percentage()).isEqualTo(20);
        assertThat(match.recommendable()).isFalse();
    }

    @Test
    void unknownNeed_canBeRecommendedButNeverBestMatch() {
        Opportunity vague = opportunity("Help needed", null, "Matara", "Sinhala");
        vague.setLocationType("Remote OK");
        CreatorCandidate everything = creator(MATARA, "Videography, Photography", "Traditional Foods",
                "Sinhala", "5.0", 50);

        Match match = score(vague, everything);

        // 30 partial skill + 15 remote + 10 language + 3 rating + 2 jobs = 60
        assertThat(match.percentage()).isEqualTo(60);
        assertThat(match.recommendable()).isTrue();
        assertThat(match.bestMatchWorthy()).isFalse();
    }

    // ── Location ────────────────────────────────────────────────────────────

    @Test
    void sameProvince_earnsNearbyPoints() {
        Opportunity food = opportunity("Traditional recipe documentation", "Food", "Matara", null);
        CreatorCandidate galle = creator(GALLE, "Videography", null, null, null, 0);

        Match match = score(food, galle);

        assertThat(match.reasons()).contains("Lives nearby in Galle (Southern)");
        assertThat(match.percentage()).isEqualTo(45 + 8);
    }

    @Test
    void remoteOpportunity_locationDoesNotMatter() {
        Opportunity words = opportunity("Old fishing terms and sayings", "Language", "Matara", null);
        words.setLocationType("Remote OK");
        CreatorCandidate kandyWriter = creator(KANDY, "Transcription", null, null, null, 0);

        Match match = score(words, kandyWriter);

        assertThat(match.reasons()).contains("Can work on this remotely");
    }

    // ── Keyword matching ────────────────────────────────────────────────────

    @Test
    void stems_onlyMatchAtTheStartOfAWord() {
        assertThat(TextMatching.containsStem("photography walk", "photo")).isTrue();
        assertThat(TextMatching.containsStem("birthday party", "art")).isFalse();
        assertThat(TextMatching.containsStem("teaching children", "tea estate")).isFalse();
    }

    @Test
    void languagesAreDetectedFromFreeText_caseInsensitively() {
        CreatorCandidate creator = creator(null, "Translation", "Tamil folklore", "Fluent in ENGLISH", null, 0);

        assertThat(creator.languages()).containsExactly("Tamil", "English");
    }
}
