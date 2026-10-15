package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.OpportunityCardResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.ExperienceLevel;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityCreatorInvitation;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.matching.CreatorCandidateLoader;
import lk.ac.sliit.legacylens.marketplace.matching.ElderTrustLookup;
import lk.ac.sliit.legacylens.marketplace.matching.OpportunityEligibility;
import lk.ac.sliit.legacylens.marketplace.matching.OpportunityMatcher;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityCreatorInvitationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.City;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.CityRepository;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import lk.ac.sliit.legacylens.users.repository.KnowledgeHolderProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;

/** The creator -> opportunity recommendations, end to end through the real matcher, eligibility and scorer. */
@ExtendWith(MockitoExtension.class)
class OpportunityServiceImplTest {

    @Mock private OpportunityRepository opportunityRepository;
    @Mock private KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;
    @Mock private UserRepository userRepository;
    @Mock private CreatorProfileRepository creatorProfileRepository;
    @Mock private CreatorApplicationRepository creatorApplicationRepository;
    @Mock private JobRepository jobRepository;
    @Mock private OpportunityApplicationRepository applicationRepository;
    @Mock private OpportunityCreatorInvitationRepository invitationRepository;
    @Mock private CityRepository cityRepository;
    @Mock private ElderTrustLookup elderTrustLookup;

    private OpportunityServiceImpl service;

    private final City matara = city(1, "Matara", "Southern");
    private final City kandy = city(2, "Kandy", "Central");
    private User nimal;
    private User elder;
    private CreatorProfile nimalProfile;

    private static City city(int id, String name, String region) {
        City city = new City();
        city.setId(id);
        city.setName(name);
        city.setRegion(region);
        return city;
    }

    private static User user(String name) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFullName(name);
        user.setAccountStatus(AccountStatus.ACTIVE);
        return user;
    }

    @BeforeEach
    void setUp() {
        CreatorCandidateLoader loader = new CreatorCandidateLoader(
                creatorProfileRepository, creatorApplicationRepository, jobRepository, opportunityRepository);
        OpportunityEligibility eligibility = new OpportunityEligibility(applicationRepository, invitationRepository, jobRepository);
        service = new OpportunityServiceImpl(opportunityRepository, knowledgeHolderProfileRepository, userRepository,
                new OpportunityMatcher(loader, cityRepository, elderTrustLookup, eligibility), applicationRepository);

        elder = user("Anura Bandara");
        nimal = user("Nimal Perera");
        nimal.setCity(matara);

        nimalProfile = new CreatorProfile();
        nimalProfile.setUser(nimal);
        nimalProfile.setSkills("Videography, Photography");
        nimalProfile.setVerificationStatus(VerificationStatus.VERIFIED);

        CreatorApplication application = new CreatorApplication();
        application.setUser(nimal);
        application.setLanguages("Sinhala:FLUENT");
        application.setExperienceLevel(ExperienceLevel.EXPERIENCED);

        lenient().when(creatorProfileRepository.findByUserId(nimal.getId())).thenReturn(Optional.of(nimalProfile));
        lenient().when(creatorApplicationRepository.findByUserIdIn(anyCollection())).thenReturn(List.of(application));
        lenient().when(jobRepository.findByCreatorIdInAndStatus(anyCollection(), eq(JobStatus.COMPLETED)))
                .thenReturn(List.of(completedJob("Recipe film 1"), completedJob("Recipe film 2")));
        lenient().when(cityRepository.findAll()).thenReturn(List.of(matara, kandy));
        lenient().when(elderTrustLookup.trustOf(any())).thenReturn(0.5);
        lenient().when(applicationRepository.findByCreatorIdOrderBySavedAtDesc(nimal.getId())).thenReturn(List.of());
        lenient().when(invitationRepository.findByCreatorId(nimal.getId())).thenReturn(List.of());
        lenient().when(jobRepository.findByCreatorIdAndStatusIn(eq(nimal.getId()), any())).thenReturn(List.of());
    }

    private Job completedJob(String title) {
        Job job = new Job();
        job.setId(UUID.randomUUID());
        job.setCreator(nimal);
        job.setTitle(title);
        job.setDescription("Filmed a traditional recipe");
        job.setStatus(JobStatus.COMPLETED);
        return job;
    }

    private Opportunity opportunity(String title, String category, String location) {
        Opportunity opportunity = new Opportunity();
        opportunity.setId(UUID.randomUUID());
        opportunity.setElder(elder);
        opportunity.setTitle(title);
        opportunity.setCategory(category);
        opportunity.setLocation(location);
        opportunity.setLanguage("Sinhala");
        opportunity.setLocationType("On-Site");
        opportunity.setStatus(OpportunityStatus.PUBLISHED);
        opportunity.setCreatedAt(LocalDateTime.now());
        return opportunity;
    }

    private void published(Opportunity... opportunities) {
        lenient().when(opportunityRepository.findByStatusOrderByCreatedAtDesc(eq(OpportunityStatus.PUBLISHED), any()))
                .thenReturn(List.of(opportunities));
    }

    private void urgentOnes(Opportunity... opportunities) {
        lenient().when(opportunityRepository.findUrgent(eq(OpportunityStatus.PUBLISHED), any(), any(), any(), any(), any()))
                .thenReturn(List.of(opportunities));
    }

    // ── Ranking ─────────────────────────────────────────────────────────────

    @Test
    void recommended_isRankedByMatchPercentage_andLeavesOutNonFits() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        Opportunity dance = opportunity("Kandyan dance performance", "Dance", "Kandy");
        Opportunity words = opportunity("Old village words and proverbs", "Language", "Matara");
        published(dance, words, recipe);

        List<OpportunityCardResponse> result = service.getRecommended(10, nimal.getId());

        // recipe: 26.25 + 25 + 20 + 10 + 10 = 91; dance: 12.25 + 25 + 20 + 2 + 10 = 69; words needs writing - no skill, not shown.
        assertThat(result).extracting(OpportunityCardResponse::getTitle)
                .containsExactly("Traditional recipe documentation", "Kandyan dance performance");
        assertThat(result).extracting(OpportunityCardResponse::getMatchPercentage).containsExactly(91, 69);
        assertThat(result).extracting(OpportunityCardResponse::getMatchLevel).containsExactly("EXCELLENT", "GOOD_POTENTIAL");
        assertThat(result.get(0).getMatchReasons()).contains("Similar to 2 jobs you completed before",
                "You speak Sinhala (fluent)");
    }

    @Test
    void recommended_respectsTheLimit() {
        published(opportunity("Traditional recipe documentation", "Food", "Matara"),
                opportunity("Kandyan dance performance", "Dance", "Kandy"));

        assertThat(service.getRecommended(1, nimal.getId())).hasSize(1);
    }

    // ── Eligibility comes before scoring ────────────────────────────────────

    @Test
    void recommended_skipsWhatTheCreatorAlreadyAppliedFor() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        OpportunityApplication applied = new OpportunityApplication();
        applied.setOpportunity(recipe);
        applied.setCreator(nimal);
        applied.setStatus(OpportunityApplicationStatus.PENDING);
        published(recipe);
        lenient().when(applicationRepository.findByCreatorIdOrderBySavedAtDesc(nimal.getId())).thenReturn(List.of(applied));

        assertThat(service.getRecommended(10, nimal.getId())).isEmpty();
    }

    @Test
    void recommended_stillShowsAnOpportunityOnlySavedAsADraft() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        OpportunityApplication draft = new OpportunityApplication();
        draft.setOpportunity(recipe);
        draft.setCreator(nimal);
        draft.setStatus(OpportunityApplicationStatus.SAVED);
        published(recipe);
        lenient().when(applicationRepository.findByCreatorIdOrderBySavedAtDesc(nimal.getId())).thenReturn(List.of(draft));

        assertThat(service.getRecommended(10, nimal.getId())).hasSize(1);
    }

    @Test
    void recommended_skipsWhatTheCreatorWasInvitedTo() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        OpportunityCreatorInvitation invitation = new OpportunityCreatorInvitation();
        invitation.setOpportunity(recipe);
        invitation.setCreator(nimal);
        published(recipe);
        lenient().when(invitationRepository.findByCreatorId(nimal.getId())).thenReturn(List.of(invitation));

        assertThat(service.getRecommended(10, nimal.getId())).isEmpty();
    }

    @Test
    void recommended_skipsOpportunitiesPastTheirDeadline() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        recipe.setDueAt(LocalDateTime.now().minusDays(1));
        published(recipe);

        assertThat(service.getRecommended(10, nimal.getId())).isEmpty();
    }

    @Test
    void recommended_skipsADayTheCreatorIsAlreadyBookedOn() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        recipe.setScheduledDate(LocalDate.now().plusDays(5));
        Job booked = new Job();
        booked.setCreator(nimal);
        booked.setScheduledAt(LocalDate.now().plusDays(5).atTime(9, 0));
        booked.setStatus(JobStatus.UPCOMING);
        published(recipe);
        lenient().when(jobRepository.findByCreatorIdAndStatusIn(eq(nimal.getId()), any()))
                .thenReturn(List.of(booked));

        assertThat(service.getRecommended(10, nimal.getId())).isEmpty();
    }

    @Test
    void recommended_neverIncludesTheCreatorsOwnOpportunity() {
        Opportunity own = opportunity("Traditional recipe documentation", "Food", "Matara");
        own.setElder(nimal);
        published(own);

        assertThat(service.getRecommended(10, nimal.getId())).isEmpty();
    }

    @Test
    void recommended_isEmptyForACreatorWhoIsNotVerified() {
        nimalProfile.setVerificationStatus(VerificationStatus.PENDING);
        published(opportunity("Traditional recipe documentation", "Food", "Matara"));

        assertThat(service.getRecommended(10, nimal.getId())).isEmpty();
    }

    @Test
    void recommended_isEmptyForASuspendedCreator() {
        nimal.setAccountStatus(AccountStatus.SUSPENDED);
        published(opportunity("Traditional recipe documentation", "Food", "Matara"));

        assertThat(service.getRecommended(10, nimal.getId())).isEmpty();
    }

    @Test
    void recommended_isEmptyForSomeoneWhoIsNotACreator() {
        UUID stranger = UUID.randomUUID();
        lenient().when(creatorProfileRepository.findByUserId(stranger)).thenReturn(Optional.empty());
        published(opportunity("Traditional recipe documentation", "Food", "Matara"));

        assertThat(service.getRecommended(10, stranger)).isEmpty();
    }

    // ── Browsing lists show honest percentages, never invented ones ─────────

    @Test
    void recentList_showsEveryOpportunityWithItsRealPercentage() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        Opportunity words = opportunity("Old village words and proverbs", "Language", "Matara");
        lenient().when(opportunityRepository.findByStatusOrderByCreatedAtDesc(eq(OpportunityStatus.PUBLISHED), any()))
                .thenReturn(List.of(recipe, words));

        List<OpportunityCardResponse> result = service.getRecent(10, nimal.getId());

        assertThat(result).extracting(OpportunityCardResponse::getMatchPercentage).containsExactly(91, 0);
        assertThat(result.get(1).getMatchLevel()).isEqualTo("NOT_RECOMMENDED");
    }

    @Test
    void recentList_leavesOutWhatTheCreatorAlreadyAppliedFor_butOtherCreatorsStillSeeIt() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        Opportunity words = opportunity("Old village words and proverbs", "Language", "Matara");
        OpportunityApplication sent = new OpportunityApplication();
        sent.setOpportunity(recipe);
        sent.setCreator(nimal);
        sent.setStatus(OpportunityApplicationStatus.REJECTED);
        lenient().when(applicationRepository.findByCreatorIdOrderBySavedAtDesc(nimal.getId())).thenReturn(List.of(sent));
        lenient().when(opportunityRepository.findByStatusOrderByCreatedAtDesc(eq(OpportunityStatus.PUBLISHED), any()))
                .thenReturn(List.of(recipe, words));

        assertThat(service.getRecent(10, nimal.getId())).extracting(OpportunityCardResponse::getTitle)
                .containsExactly("Old village words and proverbs");
        assertThat(service.getRecent(10, UUID.randomUUID())).hasSize(2);
    }

    @Test
    void recentList_keepsAnOpportunityOnlySavedAsADraft() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        OpportunityApplication draft = new OpportunityApplication();
        draft.setOpportunity(recipe);
        draft.setCreator(nimal);
        draft.setStatus(OpportunityApplicationStatus.SAVED);
        lenient().when(applicationRepository.findByCreatorIdOrderBySavedAtDesc(nimal.getId())).thenReturn(List.of(draft));
        lenient().when(opportunityRepository.findByStatusOrderByCreatedAtDesc(eq(OpportunityStatus.PUBLISHED), any()))
                .thenReturn(List.of(recipe));

        assertThat(service.getRecent(10, nimal.getId())).hasSize(1);
    }

    @Test
    void someoneWhoIsNotACreator_getsNoPercentageAtAll() {
        UUID stranger = UUID.randomUUID();
        lenient().when(creatorProfileRepository.findByUserId(stranger)).thenReturn(Optional.empty());
        lenient().when(opportunityRepository.findByStatusOrderByCreatedAtDesc(eq(OpportunityStatus.PUBLISHED), any()))
                .thenReturn(List.of(opportunity("Traditional recipe documentation", "Food", "Matara")));

        OpportunityCardResponse card = service.getRecent(10, stranger).get(0);

        assertThat(card.getMatchPercentage()).isNull();
        assertThat(card.getMatchLevel()).isNull();
        assertThat(card.getMatchReasons()).isNull();
    }

    // ── The page's opening view, in one go ──────────────────────────────────

    @Test
    void browse_givesRecommendedUrgentAndRecent_leavingOutWhatWasAppliedFor() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        Opportunity dance = opportunity("Kandyan dance performance", "Dance", "Kandy");
        OpportunityApplication sent = new OpportunityApplication();
        sent.setOpportunity(recipe);
        sent.setCreator(nimal);
        sent.setStatus(OpportunityApplicationStatus.PENDING);
        lenient().when(applicationRepository.findByCreatorIdOrderBySavedAtDesc(nimal.getId())).thenReturn(List.of(sent));
        published(recipe, dance);
        urgentOnes(recipe, dance);

        var page = service.browse(nimal.getId());

        assertThat(page.getRecommended()).extracting(OpportunityCardResponse::getTitle).containsExactly("Kandyan dance performance");
        assertThat(page.getUrgent()).extracting(OpportunityCardResponse::getTitle).containsExactly("Kandyan dance performance");
        // The dance job is already shown above, and the recipe was applied for - so nothing is left for Recent.
        assertThat(page.getRecent()).isEmpty();
    }

    @Test
    void browse_listsAJobOnlyOnce_recommendedAndUrgentAreLeftOutOfRecent() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        Opportunity words = opportunity("Old village words and proverbs", "Language", "Matara");
        published(recipe, words);
        urgentOnes(recipe);

        var page = service.browse(nimal.getId());

        assertThat(page.getRecommended()).extracting(OpportunityCardResponse::getTitle).containsExactly("Traditional recipe documentation");
        assertThat(page.getUrgent()).extracting(OpportunityCardResponse::getTitle).containsExactly("Traditional recipe documentation");
        assertThat(page.getRecent()).extracting(OpportunityCardResponse::getTitle).containsExactly("Old village words and proverbs");
    }

    // ── Search ──────────────────────────────────────────────────────────────

    @Test
    void search_neverPassesNullToTheQuery_soAnUnusedFilterCannotBreakIt() {
        lenient().when(userRepository.findById(nimal.getId())).thenReturn(Optional.of(nimal));
        lenient().when(opportunityRepository.search(any(), any(), any(), any(), any())).thenReturn(List.of());

        service.search(20, nimal.getId(), null, false, "Education");

        org.mockito.Mockito.verify(opportunityRepository).search(eq(OpportunityStatus.PUBLISHED), eq(""), eq(""), eq("Education"), any());
    }

    // ── Detail page ─────────────────────────────────────────────────────────

    @Test
    void detail_carriesThePercentageAndWhyItMatches() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        lenient().when(opportunityRepository.findByIdAndStatus(recipe.getId(), OpportunityStatus.PUBLISHED))
                .thenReturn(Optional.of(recipe));

        var detail = service.getById(recipe.getId(), nimal.getId());

        assertThat(detail.getMatchPercentage()).isEqualTo(91);
        assertThat(detail.getMatchLevel()).isEqualTo("EXCELLENT");
        assertThat(detail.getMatchReasons()).contains("You have all 2 skills this needs");
    }

    // ── Knowledge holder profile ────────────────────────────────────────────

    @Test
    void elderProfile_showsPublicDetailsOnly_withReadableTopics() {
        Opportunity recipe = opportunity("Traditional recipe documentation", "Food", "Matara");
        elder.setCity(matara);
        var profile = new lk.ac.sliit.legacylens.users.entity.KnowledgeHolderProfile();
        profile.setBio("Keeper of southern recipes.");
        profile.setKnownTopics("village-dialects, old-stories");
        profile.setRatingCount(2);
        lenient().when(opportunityRepository.findByIdAndStatus(recipe.getId(), OpportunityStatus.PUBLISHED))
                .thenReturn(Optional.of(recipe));
        lenient().when(knowledgeHolderProfileRepository.findByUserId(elder.getId())).thenReturn(Optional.of(profile));
        lenient().when(opportunityRepository.findByElderIdAndStatusOrderByCreatedAtDesc(elder.getId(), OpportunityStatus.PUBLISHED))
                .thenReturn(List.of(recipe));

        var result = service.getElderProfile(recipe.getId());

        assertThat(result.getName()).isEqualTo(elder.getFullName());
        assertThat(result.isVerified()).isTrue();
        assertThat(result.getLocation()).isEqualTo("Matara");
        assertThat(result.getBio()).isEqualTo("Keeper of southern recipes.");
        assertThat(result.getTopics()).containsExactly("Village dialects", "Old stories");
        assertThat(result.getOpenOpportunities()).isEqualTo(1);
    }

    @Test
    void elderProfile_unknownOpportunity_isNotFound() {
        UUID id = UUID.randomUUID();
        lenient().when(opportunityRepository.findByIdAndStatus(id, OpportunityStatus.PUBLISHED)).thenReturn(Optional.empty());

        org.junit.jupiter.api.Assertions.assertThrows(
                lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException.class,
                () -> service.getElderProfile(id));
    }
}
