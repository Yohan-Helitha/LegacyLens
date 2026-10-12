package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.DashboardStatsDTO;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import lk.ac.sliit.legacylens.users.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lk.ac.sliit.legacylens.users.entity.UserRole;
import java.util.List;


/**
 * Aggregates platform-wide statistics by querying existing repositories.
 * No new DB tables or schema changes required.
 */
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardServiceImpl.class);

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final ModerationQueueRepository moderationQueueRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        log.info("Computing dashboard statistics");

        // ── All users (excludes nothing yet) ────────────────────────────────
        List<User> allUsers = userRepository.findAll();

        // Separate admins from community users by checking role assignments
        long totalAdmins = 0;
        long activeAdmins = 0;
        long totalUsers = 0;
        long suspendedUsers = 0;

        for (User user : allUsers) {
            boolean isAdmin = userRoleRepository.findByUserId(user.getId())
                    .stream()
                    .anyMatch(r -> r.getRoleType() == RoleType.ADMIN);

            if (isAdmin) {
                totalAdmins++;
                if (user.getAccountStatus() == AccountStatus.ACTIVE) {
                    activeAdmins++;
                }
            } else {
                totalUsers++;
                if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
                    suspendedUsers++;
                }
            }
        }

        // ── Pending verifications = non-admin users whose primary role is still INACTIVE ──
        long pendingVerifications = allUsers.stream()
                .filter(u -> {
                    List<UserRole> roles =
                            userRoleRepository.findByUserId(u.getId());
                    boolean isAdmin = roles.stream().anyMatch(r -> r.getRoleType() == RoleType.ADMIN);
                    if (isAdmin) return false;
                    // User is pending if they have at least one INACTIVE non-admin role
                    return roles.stream()
                            .anyMatch(r -> r.getRoleType() != RoleType.ADMIN
                                    && r.getStatus() == RoleStatus.INACTIVE);
                })
                .count();

        // ── Verified users = non-admin users with at least one ACTIVE non-admin role ──
        long verifiedUsers = allUsers.stream()
                .filter(u -> {
                    List<UserRole> roles =
                            userRoleRepository.findByUserId(u.getId());
                    boolean isAdmin = roles.stream().anyMatch(r -> r.getRoleType() == RoleType.ADMIN);
                    if (isAdmin) return false;
                    return roles.stream()
                            .anyMatch(r -> r.getRoleType() != RoleType.ADMIN
                                    && r.getStatus() == RoleStatus.ACTIVE);
                })
                .count();

        // ── Moderation counts ─────────────────────────────────────────────────
        long totalStories = moderationQueueRepository.count();
        long pendingModeration = moderationQueueRepository.findByStatus(StoryStatus.PENDING).size();
        long publishedStories = moderationQueueRepository.findByStatus(StoryStatus.PUBLISHED).size();
        long rejectedStories = moderationQueueRepository.findByStatus(StoryStatus.REJECTED).size();
        long archivedStories = moderationQueueRepository.findByStatus(StoryStatus.ARCHIVED).size();

        DashboardStatsDTO stats = DashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .pendingVerifications(pendingVerifications)
                .verifiedUsers(verifiedUsers)
                .suspendedUsers(suspendedUsers)
                .totalAdmins(totalAdmins)
                .activeAdmins(activeAdmins)
                .totalStories(totalStories)
                .pendingModeration(pendingModeration)
                .publishedStories(publishedStories)
                .rejectedStories(rejectedStories)
                .archivedStories(archivedStories)
                .build();

        log.info("Dashboard stats computed: {}", stats);
        return stats;
    }
}
