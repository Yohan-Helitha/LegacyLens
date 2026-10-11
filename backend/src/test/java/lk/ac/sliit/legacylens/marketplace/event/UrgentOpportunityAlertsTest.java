package lk.ac.sliit.legacylens.marketplace.event;

import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.matching.CreatorMatchScorer.Match;
import lk.ac.sliit.legacylens.marketplace.matching.OpportunityMatcher;
import lk.ac.sliit.legacylens.marketplace.matching.OpportunityMatcher.CreatorMatching;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UrgentOpportunityAlertsTest {

    @Mock private OpportunityRepository opportunityRepository;
    @Mock private CreatorProfileRepository creatorProfileRepository;
    @Mock private OpportunityMatcher matcher;
    @Mock private PushNotificationService pushNotificationService;

    private UrgentOpportunityAlerts alerts;
    private Opportunity opportunity;

    @BeforeEach
    void setUp() {
        alerts = new UrgentOpportunityAlerts(opportunityRepository, creatorProfileRepository, matcher, pushNotificationService);

        User elder = new User();
        elder.setId(UUID.randomUUID());
        elder.setFullName("Kamala Wijesinghe");
        opportunity = new Opportunity();
        opportunity.setId(UUID.randomUUID());
        opportunity.setTitle("Record Oral History");
        opportunity.setElder(elder);
        opportunity.setUrgent(true);
        opportunity.setScheduledDate(LocalDate.of(2026, 8, 27));
        lenient().when(opportunityRepository.findById(opportunity.getId())).thenReturn(Optional.of(opportunity));
    }

    private UUID creatorWithMatch(int percentage, boolean canDoTheWork, boolean eligible) {
        User user = new User();
        user.setId(UUID.randomUUID());
        CreatorProfile profile = new CreatorProfile();
        profile.setUser(user);
        lenient().when(creatorProfileRepository.findByVerificationStatus(VerificationStatus.VERIFIED))
                .thenReturn(List.of(profile));

        CreatorMatching matching = mock(CreatorMatching.class);
        when(matching.isCreator()).thenReturn(true);
        when(matching.isEligible(opportunity)).thenReturn(eligible);
        lenient().when(matching.score(opportunity)).thenReturn(new Match(null, percentage, canDoTheWork, canDoTheWork, List.of()));
        when(matcher.forCreator(user.getId())).thenReturn(matching);
        return user.getId();
    }

    @Test
    void aCreatorMatchingAtLeast70Percent_isToldAboutTheUrgentOpportunity() {
        UUID creator = creatorWithMatch(82, true, true);

        alerts.alertMatchingCreators(opportunity.getId());

        ArgumentCaptor<PushMessage> sent = ArgumentCaptor.forClass(PushMessage.class);
        verify(pushNotificationService).sendToUser(eq(creator), sent.capture());
        assertThat(sent.getValue().title()).contains("Urgent Opportunity");
        assertThat(sent.getValue().body()).contains("Record Oral History").contains("Kamala Wijesinghe")
                .contains("27 Aug 2026").contains("82%");
        assertThat(sent.getValue().data()).containsEntry("type", "urgent-opportunity")
                .containsEntry("opportunityId", opportunity.getId().toString());
    }

    @Test
    void aCreatorBelow70Percent_hearsNothing() {
        creatorWithMatch(69, true, true);

        alerts.alertMatchingCreators(opportunity.getId());

        verify(pushNotificationService, never()).sendToUser(any(), any());
    }

    @Test
    void aCreatorWhoCannotTakeIt_hearsNothing_evenWithAHighScore() {
        creatorWithMatch(90, true, false);

        alerts.alertMatchingCreators(opportunity.getId());

        verify(pushNotificationService, never()).sendToUser(any(), any());
    }

    @Test
    void anOpportunityThatIsNotUrgent_alertsNobody() {
        opportunity.setUrgent(false);

        alerts.alertMatchingCreators(opportunity.getId());

        verify(pushNotificationService, never()).sendToUser(any(), any());
        verify(creatorProfileRepository, never()).findByVerificationStatus(any());
    }
}
