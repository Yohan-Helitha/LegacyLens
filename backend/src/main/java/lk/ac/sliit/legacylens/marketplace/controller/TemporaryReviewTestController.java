package lk.ac.sliit.legacylens.marketplace.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorReviewResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkFeedbackResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.service.CreatorRatingService;
import lk.ac.sliit.legacylens.marketplace.service.WorkFeedbackService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * TEMPORARY - lets a creator stand in for the knowledge holder and the admin on their own submitted work,
 * so the whole review flow (awaiting review, sent back, approved, completed) can be tried before the real
 * elder and admin screens exist. It goes through exactly the same service the real endpoints use, as the
 * job's own knowledge holder or as an admin. Remove it once those screens exist.
 */
@RestController
@RequestMapping("/api/jobs/{jobId}/work-progress/test")
public class TemporaryReviewTestController {

    private static final String SAMPLE_NOTE = "Please improve this content and submit it again. (test feedback)";

    private final JobRepository jobRepository;
    private final WorkFeedbackService feedbackService;
    private final CreatorRatingService ratingService;

    public TemporaryReviewTestController(
            JobRepository jobRepository, WorkFeedbackService feedbackService, CreatorRatingService ratingService) {
        this.jobRepository = jobRepository;
        this.feedbackService = feedbackService;
        this.ratingService = ratingService;
    }

    /** The job's knowledge holder gives the creator this many stars (1-5) - the same service the real endpoint uses. */
    @PostMapping("/rate/{stars}")
    public ResponseEntity<ApiResponse<CreatorReviewResponse>> rate(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobId,
            @PathVariable int stars) {

        Job job = jobRepository.findByIdAndCreatorId(jobId, principal.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        return ResponseEntity.ok(ApiResponse.ok("Rating recorded",
                ratingService.rateCreator(job.getElder().getId(), jobId, stars, "Test review (" + stars + " stars)")));

    }

    /** {@code by} is "elder" or "admin"; {@code action} is "approve" or "reject". */
    @PostMapping("/{by}/{action}")
    public ResponseEntity<ApiResponse<WorkFeedbackResponse>> review(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobId,
            @PathVariable String by,
            @PathVariable String action) {

        Job job = jobRepository.findByIdAndCreatorId(jobId, principal.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        UUID elderId = job.getElder().getId();

        boolean approve = "approve".equals(action);
        if (!approve && !"reject".equals(action)) {
            throw new InvalidRequestException("action must be approve or reject");
        }
        WorkFeedbackResponse result;
        if ("elder".equals(by)) {
            result = approve ? feedbackService.approveAsElder(elderId, jobId)
                    : feedbackService.leaveElderFeedback(elderId, jobId, SAMPLE_NOTE);
        } else if ("admin".equals(by)) {
            result = approve ? feedbackService.approveAsAdmin(jobId)
                    : feedbackService.leaveAdminFeedback(jobId, SAMPLE_NOTE);
        } else {
            throw new InvalidRequestException("by must be elder or admin");
        }
        return ResponseEntity.ok(ApiResponse.ok("Review recorded", result));
    }
}
