package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityRecommendationsResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorInvitationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityCreatorInvitation;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityCreatorInvitationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreatorRecommendationServiceImplTest {

    private static final UUID ELDER_ID = UUID.randomUUID();

    @Mock private OpportunityRepository opportunityRepository;
    @Mock private OpportunityApplicationRepository opportunityApplicationRepository;
    @Mock private OpportunityCreatorInvitationRepository invitationRepository;
    @Mock private CreatorProfileRepository creatorProfileRepository;
    @Mock private CreatorApplicationRepository creatorApplicationRepository;
    @Mock private JobRepository jobRepository;

    private CreatorRecommendationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CreatorRecommendationServiceImpl(
                opportunityRepository, opportunityApplicationRepository, invitationRepository,
                creatorProfileRepository, creatorApplicationRepository, jobRepository);
    }

    private static User user(UUID id, String name) {
        User user = new User();
        user.setId(id);
        user.setFullName(name);
        user.setAccountStatus(AccountStatus.ACTIVE);
        return user;
    }

    private static Opportunity opportunity(String title, String category, OpportunityStatus status) {
        Opportunity opportunity = new Opportunity();
        opportunity.setId(UUID.randomUUID());
        opportunity.setElder(user(ELDER_ID, "Anura Bandara"));
        opportunity.setTitle(title);
        opportunity.setCategory(category);
        opportunity.setStatus(status);
        return opportunity;
    }

    private static CreatorProfile verifiedCreator(String name, String skills, String rating) {
        CreatorProfile profile = new CreatorProfile();
        profile.setUser(user(UUID.randomUUID(), name));
        profile.setSkills(skills);
        profile.setVerificationStatus(VerificationStatus.VERIFIED);
        profile.setRating(rating == null ? null : new BigDecimal(rating));
        return profile;
    }

    private static OpportunityApplication application(Opportunity opportunity, User creator, OpportunityApplicationStatus status) {
        OpportunityApplication application = new OpportunityApplication();
        application.setId(UUID.randomUUID());
        application.setOpportunity(opportunity);
        application.setCreator(creator);
        application.setStatus(status);
        return application;
    }

    // ── getMyRecommendations ────────────────────────────────────────────────

    @Test
    void getMyRecommendations_noOpenOpportunities_returnsEmptyWithoutScoring() {
        when(opportunityRepository.findByElderIdAndStatusOrderByCreatedAtDesc(ELDER_ID, OpportunityStatus.PUBLISHED))
                .thenReturn(List.of());

        assertThat(service.getMyRecommendations(ELDER_ID)).isEmpty();
        verify(creatorProfileRepository, never()).findByVerificationStatus(any());
    }

    @Test
    void getMyRecommendations_onlyPublishedOpportunities_areRequested() {
        when(opportunityRepository.findByElderIdAndStatusOrderByCreatedAtDesc(ELDER_ID, OpportunityStatus.PUBLISHED))
                .thenReturn(List.of());

        service.getMyRecommendations(ELDER_ID);

        verify(opportunityRepository).findByElderIdAndStatusOrderByCreatedAtDesc(ELDER_ID, OpportunityStatus.PUBLISHED);
    }

    @Test
    void getMyRecommendations_oneSectionPerOpportunity_rankedAndIrrelevantCreatorsDropped() {
        Opportunity food = opportunity("Traditional recipe documentation", "Food", OpportunityStatus.PUBLISHED);
        Opportunity craft = opportunity("Mask carving", "Craft", OpportunityStatus.PUBLISHED);

        CreatorProfile nimal = verifiedCreator("Nimal Perera", "Food, Video Editing", "4.8");
        CreatorProfile ayesha = verifiedCreator("Ayesha Fernando", "Food", "4.7");
        CreatorProfile kasun = verifiedCreator("Kasun Silva", "Craft", null);
        CreatorProfile unrelated = verifiedCreator("Ruwan Jayasuriya", "Music", "5.0");

        when(opportunityRepository.findByElderIdAndStatusOrderByCreatedAtDesc(ELDER_ID, OpportunityStatus.PUBLISHED))
                .thenReturn(List.of(food, craft));
        when(creatorProfileRepository.findByVerificationStatus(VerificationStatus.VERIFIED))
                .thenReturn(List.of(nimal, ayesha, kasun, unrelated));
        when(creatorApplicationRepository.findByUserIdIn(anyCollection())).thenReturn(List.of());
        List<Object[]> jobCounts = new ArrayList<>();
        jobCounts.add(new Object[] { nimal.getUser().getId(), 24L });
        when(jobRepository.countByStatusGroupedByCreator(JobStatus.COMPLETED)).thenReturn(jobCounts);
        when(opportunityApplicationRepository.findByOpportunityIdIn(anyCollection())).thenReturn(List.of());
        when(invitationRepository.findByOpportunityIdIn(anyCollection())).thenReturn(List.of());

        List<OpportunityRecommendationsResponse> result = service.getMyRecommendations(ELDER_ID);

        assertThat(result).hasSize(2);

        OpportunityRecommendationsResponse foodSection = result.get(0);
        assertThat(foodSection.getOpportunity().getOpportunityId()).isEqualTo(food.getId());
        assertThat(foodSection.getBestMatch().getName()).isEqualTo("Nimal Perera");
        assertThat(foodSection.getBestMatch().getReasons()).contains("Has experience with Food work");
        assertThat(foodSection.getOthers()).extracting("name").containsExactly("Ayesha Fernando");
        assertThat(foodSection.getChosenCreator()).isNull();

        OpportunityRecommendationsResponse craftSection = result.get(1);
        assertThat(craftSection.getBestMatch().getName()).isEqualTo("Kasun Silva");
        assertThat(craftSection.getOthers()).isEmpty();
    }

    @Test
    void getMyRecommendations_elderIsNeverRecommendedToThemselves() {
        Opportunity food = opportunity("Recipes", "Food", OpportunityStatus.PUBLISHED);
        CreatorProfile elderAsCreator = verifiedCreator("Anura Bandara", "Food", "5.0");
        elderAsCreator.getUser().setId(ELDER_ID);

        when(opportunityRepository.findByElderIdAndStatusOrderByCreatedAtDesc(ELDER_ID, OpportunityStatus.PUBLISHED))
                .thenReturn(List.of(food));
        when(creatorProfileRepository.findByVerificationStatus(VerificationStatus.VERIFIED))
                .thenReturn(List.of(elderAsCreator));
        when(opportunityApplicationRepository.findByOpportunityIdIn(anyCollection())).thenReturn(List.of());
        when(invitationRepository.findByOpportunityIdIn(anyCollection())).thenReturn(List.of());

        OpportunityRecommendationsResponse section = service.getMyRecommendations(ELDER_ID).get(0);

        assertThat(section.getBestMatch()).isNull();
        assertThat(section.getOthers()).isEmpty();
    }

    // ── chooseCreator ───────────────────────────────────────────────────────

    @Test
    void chooseCreator_creatorAlreadyApplied_approvesTheirApplication() {
        Opportunity opp = opportunity("Recipes", "Food", OpportunityStatus.PUBLISHED);
        CreatorProfile nimal = verifiedCreator("Nimal Perera", "Food", "4.8");
        OpportunityApplication pending = application(opp, nimal.getUser(), OpportunityApplicationStatus.PENDING);

        when(opportunityRepository.findById(opp.getId())).thenReturn(Optional.of(opp));
        when(opportunityApplicationRepository.findByOpportunityId(opp.getId())).thenReturn(List.of(pending));
        when(invitationRepository.findByOpportunityId(opp.getId())).thenReturn(List.of());
        when(creatorProfileRepository.findByUserId(nimal.getUser().getId())).thenReturn(Optional.of(nimal));

        service.chooseCreator(ELDER_ID, opp.getId(), nimal.getUser().getId());

        assertThat(pending.getStatus()).isEqualTo(OpportunityApplicationStatus.APPROVED);
        verify(opportunityApplicationRepository).save(pending);
        verify(invitationRepository, never()).save(any());
    }

    @Test
    void chooseCreator_creatorHasNotApplied_createsInvitation() {
        Opportunity opp = opportunity("Recipes", "Food", OpportunityStatus.PUBLISHED);
        CreatorProfile nimal = verifiedCreator("Nimal Perera", "Food", "4.8");

        when(opportunityRepository.findById(opp.getId())).thenReturn(Optional.of(opp));
        when(opportunityApplicationRepository.findByOpportunityId(opp.getId())).thenReturn(List.of());
        when(invitationRepository.findByOpportunityId(opp.getId())).thenReturn(List.of());
        when(creatorProfileRepository.findByUserId(nimal.getUser().getId())).thenReturn(Optional.of(nimal));

        service.chooseCreator(ELDER_ID, opp.getId(), nimal.getUser().getId());

        ArgumentCaptor<OpportunityCreatorInvitation> saved = ArgumentCaptor.forClass(OpportunityCreatorInvitation.class);
        verify(invitationRepository).save(saved.capture());
        assertThat(saved.getValue().getOpportunity()).isSameAs(opp);
        assertThat(saved.getValue().getCreator()).isSameAs(nimal.getUser());
        assertThat(saved.getValue().getStatus()).isEqualTo(CreatorInvitationStatus.INVITED);
    }

    @Test
    void chooseCreator_someoneElsesOpportunity_isNotFound() {
        Opportunity opp = opportunity("Recipes", "Food", OpportunityStatus.PUBLISHED);
        when(opportunityRepository.findById(opp.getId())).thenReturn(Optional.of(opp));

        assertThrows(ResourceNotFoundException.class,
                () -> service.chooseCreator(UUID.randomUUID(), opp.getId(), UUID.randomUUID()));
    }

    @Test
    void chooseCreator_completedOpportunity_isRejected() {
        Opportunity opp = opportunity("Recipes", "Food", OpportunityStatus.COMPLETED);
        when(opportunityRepository.findById(opp.getId())).thenReturn(Optional.of(opp));

        assertThrows(InvalidApplicationStateException.class,
                () -> service.chooseCreator(ELDER_ID, opp.getId(), UUID.randomUUID()));
    }

    @Test
    void chooseCreator_differentCreatorAlreadyChosen_isRejected() {
        Opportunity opp = opportunity("Recipes", "Food", OpportunityStatus.PUBLISHED);
        User alreadyChosen = user(UUID.randomUUID(), "Ayesha Fernando");
        OpportunityCreatorInvitation invitation = new OpportunityCreatorInvitation();
        invitation.setOpportunity(opp);
        invitation.setCreator(alreadyChosen);

        when(opportunityRepository.findById(opp.getId())).thenReturn(Optional.of(opp));
        when(opportunityApplicationRepository.findByOpportunityId(opp.getId())).thenReturn(List.of());
        when(invitationRepository.findByOpportunityId(opp.getId())).thenReturn(List.of(invitation));

        assertThrows(InvalidApplicationStateException.class,
                () -> service.chooseCreator(ELDER_ID, opp.getId(), UUID.randomUUID()));
    }

    @Test
    void chooseCreator_sameCreatorChosenAgain_isANoOp() {
        Opportunity opp = opportunity("Recipes", "Food", OpportunityStatus.PUBLISHED);
        User chosen = user(UUID.randomUUID(), "Nimal Perera");
        OpportunityApplication approved = application(opp, chosen, OpportunityApplicationStatus.APPROVED);

        when(opportunityRepository.findById(opp.getId())).thenReturn(Optional.of(opp));
        when(opportunityApplicationRepository.findByOpportunityId(opp.getId())).thenReturn(List.of(approved));
        when(invitationRepository.findByOpportunityId(opp.getId())).thenReturn(List.of());

        service.chooseCreator(ELDER_ID, opp.getId(), chosen.getId());

        verify(opportunityApplicationRepository, never()).save(any());
        verify(invitationRepository, never()).save(any());
    }

    @Test
    void chooseCreator_unverifiedCreator_isNotFound() {
        Opportunity opp = opportunity("Recipes", "Food", OpportunityStatus.PUBLISHED);
        CreatorProfile pending = verifiedCreator("Kasun Silva", "Food", null);
        pending.setVerificationStatus(VerificationStatus.PENDING);

        when(opportunityRepository.findById(opp.getId())).thenReturn(Optional.of(opp));
        when(opportunityApplicationRepository.findByOpportunityId(opp.getId())).thenReturn(List.of());
        when(invitationRepository.findByOpportunityId(opp.getId())).thenReturn(List.of());
        when(creatorProfileRepository.findByUserId(pending.getUser().getId())).thenReturn(Optional.of(pending));

        assertThrows(ResourceNotFoundException.class,
                () -> service.chooseCreator(ELDER_ID, opp.getId(), pending.getUser().getId()));
    }
}
