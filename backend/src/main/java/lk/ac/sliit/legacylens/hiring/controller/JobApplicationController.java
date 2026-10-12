package lk.ac.sliit.legacylens.hiring.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.hiring.dto.JobApplicationSummaryDto;
import lk.ac.sliit.legacylens.hiring.dto.RejectApplicationRequest;
import lk.ac.sliit.legacylens.hiring.service.JobApplicationQueryService;
import lk.ac.sliit.legacylens.hiring.service.JobApplicationReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** The elder's applicant-review surface for a single job request: list, approve, reject. */
@RestController
@RequestMapping("/api/job-requests/{jobRequestId}/applications")
public class JobApplicationController {

    private final JobApplicationQueryService jobApplicationQueryService;
    private final JobApplicationReviewService jobApplicationReviewService;

    public JobApplicationController(
            JobApplicationQueryService jobApplicationQueryService,
            JobApplicationReviewService jobApplicationReviewService) {

        this.jobApplicationQueryService = jobApplicationQueryService;
        this.jobApplicationReviewService = jobApplicationReviewService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobApplicationSummaryDto>>> getApplications(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobRequestId) {

        List<JobApplicationSummaryDto> applications =
                jobApplicationQueryService.getApplications(jobRequestId, principal.getUser().getId());

        return ResponseEntity.ok(ApiResponse.ok(applications));
    }

    @PostMapping("/{applicationId}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobRequestId,
            @PathVariable UUID applicationId) {

        jobApplicationReviewService.approve(jobRequestId, applicationId, principal.getUser().getId());

        return ResponseEntity.ok(ApiResponse.ok("Application approved", null));
    }

    @PostMapping("/{applicationId}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobRequestId,
            @PathVariable UUID applicationId,
            @RequestBody(required = false) RejectApplicationRequest request) {

        String reason = request != null ? request.getReason() : null;
        jobApplicationReviewService.reject(jobRequestId, applicationId, principal.getUser().getId(), reason);

        return ResponseEntity.ok(ApiResponse.ok("Application rejected", null));
    }
}
