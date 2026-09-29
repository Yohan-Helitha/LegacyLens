package lk.ac.sliit.legacylens.admin.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Aggregated platform statistics returned by GET /api/admin/dashboard/stats.
 * All counts are computed in-memory from existing repositories — no new DB
 * schema is required.
 */
@Data
@Builder
public class DashboardStatsDTO {

    // ── User / Verification ──────────────────────────────────────────────────
    private long totalUsers;
    private long pendingVerifications;
    private long verifiedUsers;
    private long suspendedUsers;

    // ── Admin Management ─────────────────────────────────────────────────────
    private long totalAdmins;
    private long activeAdmins;

    // ── Content / Moderation ─────────────────────────────────────────────────
    private long totalStories;
    private long pendingModeration;
    private long publishedStories;
    private long rejectedStories;
    private long archivedStories;
}
