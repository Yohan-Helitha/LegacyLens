package lk.ac.sliit.legacylens.marketplace.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorReviewRequest;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorReviewResponse;
import lk.ac.sliit.legacylens.marketplace.service.CreatorRatingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** A knowledge holder rating the creator who did a completed job for them. Only the job's own elder can. */
@RestController
@RequestMapping("/api/elder/creator-rating/jobs/{jobId}")
public class ElderCreatorRatingController {

    private final CreatorRatingService ratingService;

    public ElderCreatorRatingController(CreatorRatingService ratingService) {
        this.ratingService = ratingService;
    }

    /** Their existing review of this job; data is null if they have not rated it yet. */
    @GetMapping
    public ResponseEntity<ApiResponse<CreatorReviewResponse>> get(
            @AuthenticationPrincipal CustomUserDetails principal, @PathVariable UUID jobId) {
        return ResponseEntity.ok(ApiResponse.ok(ratingService.myReview(principal.getUser().getId(), jobId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CreatorReviewResponse>> rate(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobId,
            @Valid @RequestBody CreatorReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Thank you for rating the creator", ratingService.rateCreator(
                principal.getUser().getId(), jobId, request.getRating(), request.getComment())));
    }
}
