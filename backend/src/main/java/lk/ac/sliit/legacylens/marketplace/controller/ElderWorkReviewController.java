package lk.ac.sliit.legacylens.marketplace.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkSubmissionDetailResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkSubmissionSummaryResponse;
import lk.ac.sliit.legacylens.marketplace.service.WorkReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * The knowledge holder's review queue: the work creators submitted for their own jobs, and what each
 * submission contains. Approving or asking for changes is /api/elder/work-feedback.
 */
@RestController
@RequestMapping("/api/elder/work-review")
public class ElderWorkReviewController {

    private final WorkReviewService reviewService;

    public ElderWorkReviewController(WorkReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkSubmissionSummaryResponse>>> list(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.listForElder(principal.getUser().getId())));
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<ApiResponse<WorkSubmissionDetailResponse>> get(
            @AuthenticationPrincipal CustomUserDetails principal, @PathVariable UUID jobId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.viewForElder(principal.getUser().getId(), jobId)));
    }
}
