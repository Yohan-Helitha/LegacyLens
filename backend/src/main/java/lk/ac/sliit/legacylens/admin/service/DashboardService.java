package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.DashboardStatsDTO;

/**
 * Service interface for aggregating platform-wide dashboard statistics.
 */
public interface DashboardService {

    /**
     * Compute and return a snapshot of all key platform metrics.
     * All counts are derived from existing repositories without touching the DB schema.
     */
    DashboardStatsDTO getDashboardStats();
}
