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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CreatorMatchScorerTest {

    private static Opportunity opportunity(String title, String category, String location, String language) {
        Opportunity opportunity = new Opportunity();
        opportunity.setId(UUID.randomUUID());
        opportunity.setTitle(title);
        opportunity.setCategory(category);
        opportunity.setLocation(location);
        opportunity.setLanguage(language);
        return opportunity;
    }

    private static CreatorCandidate candidate(String city, String skills, String interests, String about,
                                              BigDecimal rating, long completedJobs) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFullName("Nimal Perera");
        if (city != null) {
            City c = new City();
            c.setName(city);
            user.setCity(c);
        }

        CreatorProfile profile = new CreatorProfile();
        profile.setUser(user);
        profile.setSkills(skills);
        profile.setInterests(interests);
        profile.setRating(rating);

        CreatorApplication application = new CreatorApplication();
        application.setUser(user);
        application.setAboutYou(about);

        return new CreatorCandidate(user, profile, application, completedJobs);
    }

    @Test
    void everyOpportunitySignal_addsPointsAndAReason() {
        Opportunity opp = opportunity("Traditional recipe video", "Food", "Matara, Southern Province", "Sinhala");
        CreatorCandidate creator = candidate("Matara", "Video, Photography", "Food, Folklore",
                "I speak Sinhala and English", new BigDecimal("4.8"), 24);

        Match match = CreatorMatchScorer.score(opp, creator, true);

        assertThat(match.relevant()).isTrue();
        assertThat(match.reasons()).containsExactly(
                "Has experience with Food work",
                "Skilled in Video",
                "Speaks Sinhala",
                "Lives in Matara, close to this opportunity",
                "Has already applied for this opportunity",
                "Highly rated by other elders (4.8 stars)",
                "Has completed 24 jobs on LegacyLens");
        // 35 category + 10 skill + 20 language + 20 location + 15 applied + 10 rating (4.8 -> 10) + 10 jobs (capped)
        assertThat(match.score()).isEqualTo(120);
    }

    @Test
    void ratingAndExperienceAlone_isNotAMatch() {
        Opportunity opp = opportunity("Pottery traditions", "Craft", "Kandy", "Tamil");
        CreatorCandidate creator = candidate("Galle", "Photography", "Music", null, new BigDecimal("5.0"), 40);

        Match match = CreatorMatchScorer.score(opp, creator, false);

        assertThat(match.relevant()).isFalse();
    }

    @Test
    void languagesAreDetectedFromFreeText_caseInsensitively() {
        CreatorCandidate creator = candidate(null, "translation", "tamil folklore", "Fluent in ENGLISH", null, 0);

        assertThat(creator.languages()).containsExactly("Tamil", "English");
    }

    @Test
    void lowRatingAndFewJobs_countButAreNotCalledOut() {
        Opportunity opp = opportunity("Village festival", "Festival", "Kandy", null);
        CreatorCandidate creator = candidate("Kandy", "Photography", null, null, new BigDecimal("3.0"), 2);

        Match match = CreatorMatchScorer.score(opp, creator, false);

        assertThat(match.reasons()).containsExactly("Lives in Kandy, close to this opportunity");
        // 20 location + 6 rating (3.0 of 5 -> 6) + 2 jobs
        assertThat(match.score()).isEqualTo(28);
    }
}
