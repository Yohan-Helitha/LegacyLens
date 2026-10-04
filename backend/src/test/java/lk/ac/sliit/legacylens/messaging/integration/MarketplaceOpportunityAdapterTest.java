package lk.ac.sliit.legacylens.messaging.integration;

import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityCreatorInvitationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.messaging.dto.ConversationContextResponse;
import lk.ac.sliit.legacylens.messaging.entity.Conversation;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarketplaceOpportunityAdapterTest {

    @Mock private OpportunityRepository opportunityRepository;
    @Mock private OpportunityApplicationRepository applicationRepository;
    @Mock private OpportunityCreatorInvitationRepository invitationRepository;
    @Mock private JobRepository jobRepository;

    private MarketplaceOpportunityAdapter adapter;

    private final UUID opportunityId = UUID.randomUUID();
    private final UUID creatorId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        adapter = new MarketplaceOpportunityAdapter(opportunityRepository, applicationRepository, invitationRepository, jobRepository);
    }

    private static OpportunityApplication application(OpportunityApplicationStatus status) {
        OpportunityApplication application = new OpportunityApplication();
        application.setStatus(status);
        return application;
    }

    private Opportunity opportunity() {
        Opportunity opportunity = new Opportunity();
        opportunity.setId(opportunityId);
        opportunity.setTitle("Traditional recipe documentation");
        opportunity.setCategory("Food");
        opportunity.setLocation("Negombo");
        opportunity.setScheduledDate(LocalDate.of(2026, 8, 20));
        return opportunity;
    }

    private Conversation conversationAbout(Opportunity opportunity) {
        User creator = new User();
        creator.setId(creatorId);
        Conversation conversation = new Conversation();
        conversation.setCreator(creator);
        conversation.setOpportunity(opportunity);
        return conversation;
    }

    @Test
    void creatorWithNoApplicationInvitationOrBooking_isNotConnected() {
        when(applicationRepository.findByCreatorIdAndOpportunityId(creatorId, opportunityId)).thenReturn(Optional.empty());
        when(invitationRepository.existsByOpportunityIdAndCreatorId(opportunityId, creatorId)).thenReturn(false);
        when(jobRepository.existsByOpportunityIdAndCreatorId(opportunityId, creatorId)).thenReturn(false);

        assertThat(adapter.isCreatorConnected(opportunityId, creatorId)).isFalse();
    }

    @Test
    void aSavedDraftApplication_doesNotCountAsAConnection() {
        when(applicationRepository.findByCreatorIdAndOpportunityId(creatorId, opportunityId))
                .thenReturn(Optional.of(application(OpportunityApplicationStatus.SAVED)));
        when(invitationRepository.existsByOpportunityIdAndCreatorId(opportunityId, creatorId)).thenReturn(false);
        when(jobRepository.existsByOpportunityIdAndCreatorId(opportunityId, creatorId)).thenReturn(false);

        assertThat(adapter.isCreatorConnected(opportunityId, creatorId)).isFalse();
    }

    @Test
    void aSubmittedApplication_isAConnection() {
        when(applicationRepository.findByCreatorIdAndOpportunityId(creatorId, opportunityId))
                .thenReturn(Optional.of(application(OpportunityApplicationStatus.PENDING)));

        assertThat(adapter.isCreatorConnected(opportunityId, creatorId)).isTrue();
    }

    @Test
    void anInvitation_isAConnection() {
        when(applicationRepository.findByCreatorIdAndOpportunityId(creatorId, opportunityId)).thenReturn(Optional.empty());
        when(invitationRepository.existsByOpportunityIdAndCreatorId(opportunityId, creatorId)).thenReturn(true);

        assertThat(adapter.isCreatorConnected(opportunityId, creatorId)).isTrue();
    }

    @Test
    void conversationWithoutAnOpportunity_hasNoContextCard() {
        assertThat(adapter.contextFor(conversationAbout(null))).isNull();
    }

    @Test
    void contextCard_prefersTheBookedDateOverTheOpportunitySchedule() {
        Job job = new Job();
        job.setScheduledAt(LocalDateTime.of(2026, 8, 25, 10, 0));
        job.setTimeWindowText("10:00 AM - 1:00 PM");
        when(jobRepository.findFirstByOpportunityIdAndCreatorIdOrderByCreatedAtDesc(opportunityId, creatorId))
                .thenReturn(Optional.of(job));

        ConversationContextResponse context = adapter.contextFor(conversationAbout(opportunity()));

        assertThat(context.getTitle()).isEqualTo("Traditional recipe documentation");
        assertThat(context.getDate()).isEqualTo(LocalDate.of(2026, 8, 25));
        assertThat(context.getTimeWindowText()).isEqualTo("10:00 AM - 1:00 PM");
        assertThat(context.getLocation()).isEqualTo("Negombo");
        assertThat(context.isBooked()).isTrue();
    }

    @Test
    void contextCard_beforeBooking_usesTheOpportunitySchedule() {
        when(jobRepository.findFirstByOpportunityIdAndCreatorIdOrderByCreatedAtDesc(opportunityId, creatorId))
                .thenReturn(Optional.empty());

        ConversationContextResponse context = adapter.contextFor(conversationAbout(opportunity()));

        assertThat(context.getDate()).isEqualTo(LocalDate.of(2026, 8, 20));
        assertThat(context.isBooked()).isFalse();
    }
}
