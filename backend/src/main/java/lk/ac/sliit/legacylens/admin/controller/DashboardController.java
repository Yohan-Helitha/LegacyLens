package lk.ac.sliit.legacylens.admin.controller;

import lk.ac.sliit.legacylens.admin.dto.DashboardStatsDTO;
import lk.ac.sliit.legacylens.admin.service.DashboardService;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes a single endpoint that returns all platform statistics needed by the
 * admin dashboard Overview & Analytics pages.
 *
 * <p>Endpoint: {@code GET /api/admin/dashboard/stats}
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Returns aggregated stats for the admin dashboard.
     *
     * @return {@link DashboardStatsDTO} wrapped in the standard {@link ApiResponse}
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getDashboardStats() {
        DashboardStatsDTO stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.ok("Dashboard statistics retrieved successfully", stats));
    }
}
