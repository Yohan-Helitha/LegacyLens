package lk.ac.sliit.legacylens.marketplace.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.service.ElderApplicationReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * The knowledge holder's review of creators' applications to their opportunities. Requires a
 * signed-in user; the service only ever finds applications to opportunities that user owns.
 */
@RestController
@RequestMapping("/api/elder/opportunity-applications")
public class ElderApplicationReviewController {

    private final ElderApplicationReviewService reviewService;

    public ElderApplicationReviewController(ElderApplicationReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OpportunityApplicationResponse>>> list(
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.ok(reviewService.getApplicationsForElder(principal.getUser().getId())));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<OpportunityApplicationResponse>> approve(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID id) {

        return ResponseEntity.ok(ApiResponse.ok("Application approved",
                reviewService.approve(principal.getUser().getId(), id)));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<OpportunityApplicationResponse>> reject(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID id) {

        return ResponseEntity.ok(ApiResponse.ok("Application rejected",
                reviewService.reject(principal.getUser().getId(), id)));
    }
}
