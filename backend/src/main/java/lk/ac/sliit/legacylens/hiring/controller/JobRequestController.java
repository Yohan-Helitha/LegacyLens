package lk.ac.sliit.legacylens.hiring.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestResponse;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestSubmissionDto;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestSummaryDto;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lk.ac.sliit.legacylens.hiring.service.JobRequestQueryService;
import lk.ac.sliit.legacylens.hiring.service.JobRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * The elder-facing side of "Hire a Creator": submit/draft a job request and
 * list your own. Approving/rejecting applicants lives in
 * JobApplicationController — a different responsibility, different class.
 */
@RestController
@RequestMapping("/api/job-requests")
public class JobRequestController {

    private final JobRequestService jobRequestService;
    private final JobRequestQueryService jobRequestQueryService;

    public JobRequestController(JobRequestService jobRequestService, JobRequestQueryService jobRequestQueryService) {
        this.jobRequestService = jobRequestService;
        this.jobRequestQueryService = jobRequestQueryService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<JobRequestResponse>> submit(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute JobRequestSubmissionDto request) {

        JobRequestResponse response = jobRequestService.submit(principal.getUser().getId(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Job request submitted", response));
    }

    @PostMapping(value = "/draft", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<JobRequestResponse>> saveDraft(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute JobRequestSubmissionDto request) {

        JobRequestResponse response = jobRequestService.saveDraft(principal.getUser().getId(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Draft saved", response));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<JobRequestResponse>> submitDraft(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID id) {

        JobRequestResponse response = jobRequestService.submitDraft(principal.getUser().getId(), id);

        return ResponseEntity.ok(ApiResponse.ok("Job request submitted", response));
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<JobRequestSummaryDto>>> getMine(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) JobRequestStatus status) {

        List<JobRequestSummaryDto> requests = jobRequestQueryService.getMyRequests(principal.getUser().getId(), status);

        return ResponseEntity.ok(ApiResponse.ok(requests));
    }
}
