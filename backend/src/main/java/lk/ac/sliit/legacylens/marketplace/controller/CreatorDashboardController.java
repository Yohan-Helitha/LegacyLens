package lk.ac.sliit.legacylens.marketplace.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.AddPaymentRequest;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorDashboardSummaryResponse;
import lk.ac.sliit.legacylens.marketplace.dto.JobResponse;
import lk.ac.sliit.legacylens.marketplace.dto.PaymentHistoryItemResponse;
import lk.ac.sliit.legacylens.marketplace.dto.ReviewResponse;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.service.CreatorDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read-only data for the logged-in creator's own dashboard — everything here
 * is scoped to the authenticated user, never another creator's data.
 * Requires a valid Bearer token — see SecurityConfig, only /api/auth/** and
 * /api/cities/** are public.
 */
@RestController
@RequestMapping("/api/creator-dashboard")
public class CreatorDashboardController {

    private final CreatorDashboardService creatorDashboardService;

    public CreatorDashboardController(CreatorDashboardService creatorDashboardService) {
        this.creatorDashboardService = creatorDashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<CreatorDashboardSummaryResponse>> getSummary(
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.ok(
                creatorDashboardService.getSummary(principal.getUser().getId())));
    }

    @GetMapping("/jobs")
    public ResponseEntity<ApiResponse<List<JobResponse>>> getJobs(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam JobStatus status) {

        return ResponseEntity.ok(ApiResponse.ok(
                creatorDashboardService.getJobs(principal.getUser().getId(), status)));
    }

    @GetMapping("/recent-work")
    public ResponseEntity<ApiResponse<List<JobResponse>>> getRecentWork(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(defaultValue = "3") int limit) {

        return ResponseEntity.ok(ApiResponse.ok(
                creatorDashboardService.getRecentWork(principal.getUser().getId(), limit)));
    }

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getReviews(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(defaultValue = "5") int limit) {

        return ResponseEntity.ok(ApiResponse.ok(
                creatorDashboardService.getReviews(principal.getUser().getId(), limit)));
    }

    @GetMapping("/payment-history")
    public ResponseEntity<ApiResponse<List<PaymentHistoryItemResponse>>> getPaymentHistory(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(defaultValue = "20") int limit) {

        return ResponseEntity.ok(ApiResponse.ok(
                creatorDashboardService.getPaymentHistory(principal.getUser().getId(), limit)));
    }

    /** multipart/form-data — the proof photo rides alongside the form fields, same pattern as /api/creator-applications. */
    @PostMapping(value = "/payments", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<PaymentHistoryItemResponse>> addPayment(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute AddPaymentRequest request) {

        PaymentHistoryItemResponse response = creatorDashboardService.addPayment(
                principal.getUser().getId(),
                request.getJobId(),
                request.getAmount(),
                request.getTipAmount(),
                request.getProofDocument());

        return ResponseEntity.ok(ApiResponse.ok("Payment logged", response));
    }
}
