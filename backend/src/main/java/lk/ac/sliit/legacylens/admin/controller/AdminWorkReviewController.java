package lk.ac.sliit.legacylens.admin.controller;

import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkSubmissionDetailResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkSubmissionSummaryResponse;
import lk.ac.sliit.legacylens.marketplace.service.WorkReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * The admin's review queue: every piece of work creators submitted, and what each contains. Approving,
 * asking for changes and publishing are /api/admin/work-feedback. Under /api/admin, so only admins reach it.
 */
@RestController
@RequestMapping("/api/admin/work-review")
public class AdminWorkReviewController {

    private final WorkReviewService reviewService;

    public AdminWorkReviewController(WorkReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkSubmissionSummaryResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.listForAdmin()));
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<ApiResponse<WorkSubmissionDetailResponse>> get(@PathVariable UUID jobId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.viewForAdmin(jobId)));
    }
}
