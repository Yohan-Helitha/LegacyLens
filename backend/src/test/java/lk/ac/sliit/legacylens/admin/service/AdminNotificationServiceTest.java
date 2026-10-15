package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminNotificationResponse;
import lk.ac.sliit.legacylens.admin.entity.AudioReviewStatus;
import lk.ac.sliit.legacylens.admin.entity.OpportunityAudio;
import lk.ac.sliit.legacylens.admin.repository.OpportunityAudioRepository;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkProgressRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminNotificationServiceTest {

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private ModerationQueueRepository moderationQueueRepository;

    @Mock
    private OpportunityAudioRepository opportunityAudioRepository;

    // Not stubbed: the notifications service reads them too, and an empty result is what this test wants.
    @Mock
    private CreatorApplicationRepository creatorApplicationRepository;

    @Mock
    private JobWorkProgressRepository workProgressRepository;

    @InjectMocks
    private AdminNotificationServiceImpl adminNotificationService;

    @Test
    void getAdminNotifications_aggregatesNotificationsFromAudiosOppsAndModeration() {
        OpportunityAudio audio = new OpportunityAudio();
        audio.setId(UUID.randomUUID());
        audio.setElderName("Nimal");
        audio.setTopic("Traditional Medicine");
        audio.setLocation("Matale");
        audio.setStatus(AudioReviewStatus.UNLISTENED);
        audio.setCreatedAt(LocalDateTime.now().minusHours(2));
        when(opportunityAudioRepository.findAll()).thenReturn(List.of(audio));

        Opportunity opp = new Opportunity();
        opp.setId(UUID.randomUUID());
        opp.setTitle("Lacquer Crafts Documentation");
        opp.setStatus(OpportunityStatus.PUBLISHED);
        opp.setCreatedAt(LocalDateTime.now().minusHours(1));
        opp.setRead(false);
        when(opportunityRepository.findAll()).thenReturn(List.of(opp));

        ModerationQueueItem mod = new ModerationQueueItem();
        mod.setId(UUID.randomUUID());
        mod.setTitle("Reported Story Content");
        mod.setStatus(StoryStatus.PENDING);
        mod.setCreatedAt(LocalDateTime.now());
        mod.setRead(false);
        when(moderationQueueRepository.findByStatus(StoryStatus.PENDING)).thenReturn(List.of(mod));

        List<AdminNotificationResponse> notifications = adminNotificationService.getAdminNotifications();

        assertThat(notifications).hasSize(3);
        // Sorted newest first
        assertThat(notifications.get(0).getTitle()).isEqualTo("Reported Story Content");
        assertThat(notifications.get(0).getType()).isEqualTo("moderation");
        assertThat(notifications.get(1).getTitle()).isEqualTo("Lacquer Crafts Documentation");
        assertThat(notifications.get(1).getType()).isEqualTo("opportunity");
        assertThat(notifications.get(2).getTitle()).contains("Nimal");
    }

    @Test
    void markNotificationAsRead_opportunityType_updatesOpportunity() {
        UUID id = UUID.randomUUID();
        Opportunity opp = new Opportunity();
        opp.setId(id);
        opp.setTitle("Test Opp");
        opp.setRead(false);

        when(opportunityRepository.findById(id)).thenReturn(Optional.of(opp));

        adminNotificationService.markNotificationAsRead("opportunity", id.toString());

        assertThat(opp.isRead()).isTrue();
        verify(opportunityRepository).save(opp);
    }

    @Test
    void markNotificationAsRead_moderationType_updatesModerationItem() {
        UUID id = UUID.randomUUID();
        ModerationQueueItem mod = new ModerationQueueItem();
        mod.setId(id);
        mod.setTitle("Pending Mod Item");
        mod.setRead(false);

        when(moderationQueueRepository.findById(id)).thenReturn(Optional.of(mod));

        adminNotificationService.markNotificationAsRead("moderation", id.toString());

        assertThat(mod.isRead()).isTrue();
        verify(moderationQueueRepository).save(mod);
    }

    @Test
    void markAllAsRead_marksAllOpportunitiesAndModerationItemsAsRead() {
        Opportunity opp = new Opportunity();
        opp.setId(UUID.randomUUID());
        opp.setTitle("Unread Opp");
        opp.setRead(false);
        when(opportunityRepository.findAll()).thenReturn(List.of(opp));

        ModerationQueueItem mod = new ModerationQueueItem();
        mod.setId(UUID.randomUUID());
        mod.setTitle("Unread Mod");
        mod.setRead(false);
        when(moderationQueueRepository.findByStatus(StoryStatus.PENDING)).thenReturn(List.of(mod));

        adminNotificationService.markAllAsRead();

        assertThat(opp.isRead()).isTrue();
        assertThat(mod.isRead()).isTrue();
        verify(opportunityRepository).save(opp);
        verify(moderationQueueRepository).save(mod);
    }
}
