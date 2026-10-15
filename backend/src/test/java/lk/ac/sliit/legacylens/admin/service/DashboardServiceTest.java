package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.DashboardStatsDTO;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import lk.ac.sliit.legacylens.users.repository.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private ModerationQueueRepository moderationQueueRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private User adminUser;
    private User verifiedCommunityUser;
    private User pendingSuspendedUser;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(UUID.randomUUID());
        adminUser.setFullName("Admin Overseer");
        adminUser.setAccountStatus(AccountStatus.ACTIVE);

        verifiedCommunityUser = new User();
        verifiedCommunityUser.setId(UUID.randomUUID());
        verifiedCommunityUser.setFullName("Elder Perera");
        verifiedCommunityUser.setAccountStatus(AccountStatus.ACTIVE);

        pendingSuspendedUser = new User();
        pendingSuspendedUser.setId(UUID.randomUUID());
        pendingSuspendedUser.setFullName("Suspended Applicant");
        pendingSuspendedUser.setAccountStatus(AccountStatus.SUSPENDED);
    }

    @Test
    void getDashboardStats_calculatesAggregatedStatsCorrectly() {
        when(userRepository.findAll()).thenReturn(List.of(adminUser, verifiedCommunityUser, pendingSuspendedUser));

        // Admin roles
        UserRole adminRole = new UserRole();
        adminRole.setId(UUID.randomUUID());
        adminRole.setUser(adminUser);
        adminRole.setRoleType(RoleType.ADMIN);
        adminRole.setStatus(RoleStatus.ACTIVE);
        when(userRoleRepository.findByUserId(adminUser.getId())).thenReturn(List.of(adminRole));

        // Verified community user roles
        UserRole elderRole = new UserRole();
        elderRole.setId(UUID.randomUUID());
        elderRole.setUser(verifiedCommunityUser);
        elderRole.setRoleType(RoleType.ELDER);
        elderRole.setStatus(RoleStatus.ACTIVE);
        when(userRoleRepository.findByUserId(verifiedCommunityUser.getId())).thenReturn(List.of(elderRole));

        // Pending suspended user roles
        UserRole pendingRole = new UserRole();
        pendingRole.setId(UUID.randomUUID());
        pendingRole.setUser(pendingSuspendedUser);
        pendingRole.setRoleType(RoleType.YOUTH_CREATOR);
        pendingRole.setStatus(RoleStatus.INACTIVE);
        when(userRoleRepository.findByUserId(pendingSuspendedUser.getId())).thenReturn(List.of(pendingRole));

        // Moderation queue stats
        when(moderationQueueRepository.count()).thenReturn(10L);
        when(moderationQueueRepository.findByStatus(StoryStatus.PENDING))
                .thenReturn(List.of(new ModerationQueueItem(), new ModerationQueueItem()));
        when(moderationQueueRepository.findByStatus(StoryStatus.PUBLISHED))
                .thenReturn(List.of(new ModerationQueueItem(), new ModerationQueueItem(), new ModerationQueueItem()));
        when(moderationQueueRepository.findByStatus(StoryStatus.REJECTED))
                .thenReturn(List.of(new ModerationQueueItem()));
        when(moderationQueueRepository.findByStatus(StoryStatus.ARCHIVED))
                .thenReturn(Collections.emptyList());

        DashboardStatsDTO stats = dashboardService.getDashboardStats();

        assertThat(stats).isNotNull();
        assertThat(stats.getTotalAdmins()).isEqualTo(1);
        assertThat(stats.getActiveAdmins()).isEqualTo(1);
        assertThat(stats.getTotalUsers()).isEqualTo(2); // verifiedCommunityUser + pendingSuspendedUser
        assertThat(stats.getSuspendedUsers()).isEqualTo(1);
        assertThat(stats.getVerifiedUsers()).isEqualTo(1);
        assertThat(stats.getPendingVerifications()).isEqualTo(1);

        assertThat(stats.getTotalStories()).isEqualTo(10);
        assertThat(stats.getPendingModeration()).isEqualTo(2);
        assertThat(stats.getPublishedStories()).isEqualTo(3);
        assertThat(stats.getRejectedStories()).isEqualTo(1);
        assertThat(stats.getArchivedStories()).isEqualTo(0);
    }

    @Test
    void getDashboardStats_emptyDatabase_returnsZeros() {
        when(userRepository.findAll()).thenReturn(Collections.emptyList());
        when(moderationQueueRepository.count()).thenReturn(0L);
        when(moderationQueueRepository.findByStatus(StoryStatus.PENDING)).thenReturn(Collections.emptyList());
        when(moderationQueueRepository.findByStatus(StoryStatus.PUBLISHED)).thenReturn(Collections.emptyList());
        when(moderationQueueRepository.findByStatus(StoryStatus.REJECTED)).thenReturn(Collections.emptyList());
        when(moderationQueueRepository.findByStatus(StoryStatus.ARCHIVED)).thenReturn(Collections.emptyList());

        DashboardStatsDTO stats = dashboardService.getDashboardStats();

        assertThat(stats).isNotNull();
        assertThat(stats.getTotalUsers()).isZero();
        assertThat(stats.getTotalAdmins()).isZero();
        assertThat(stats.getPendingVerifications()).isZero();
        assertThat(stats.getVerifiedUsers()).isZero();
        assertThat(stats.getSuspendedUsers()).isZero();
        assertThat(stats.getTotalStories()).isZero();
    }
}
