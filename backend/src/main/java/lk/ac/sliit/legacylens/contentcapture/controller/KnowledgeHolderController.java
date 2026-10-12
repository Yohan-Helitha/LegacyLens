package lk.ac.sliit.legacylens.contentcapture.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.common.dto.PagedResponse;
import lk.ac.sliit.legacylens.contentcapture.dto.RatingSummaryDto;
import lk.ac.sliit.legacylens.contentcapture.dto.ReviewResponseDto;
import lk.ac.sliit.legacylens.contentcapture.dto.SubmitRatingRequest;
import lk.ac.sliit.legacylens.contentcapture.dto.TrustScoreDetailDto;
import lk.ac.sliit.legacylens.contentcapture.service.RatingService;
import lk.ac.sliit.legacylens.contentcapture.service.ReviewQueryService;
import lk.ac.sliit.legacylens.contentcapture.service.TrustScoreService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** Trust score (self only) and review/rating (any elder, by id) endpoints. */
@RestController
@RequestMapping("/api/knowledge-holders")
public class KnowledgeHolderController {

    private final TrustScoreService trustScoreService;
    private final RatingService ratingService;
    private final ReviewQueryService reviewQueryService;

    public KnowledgeHolderController(
            TrustScoreService trustScoreService,
            RatingService ratingService,
            ReviewQueryService reviewQueryService) {

        this.trustScoreService = trustScoreService;
        this.ratingService = ratingService;
        this.reviewQueryService = reviewQueryService;
    }

    @GetMapping("/me/trust-score")
    public ResponseEntity<ApiResponse<TrustScoreDetailDto>> getMyTrustScore(
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.ok(trustScoreService.getDetail(principal.getUser().getId())));
    }

    @PostMapping("/{id}/ratings")
    public ResponseEntity<ApiResponse<Void>> submitRating(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable("id") UUID elderId,
            @Valid @RequestBody SubmitRatingRequest request) {

        ratingService.submitRating(elderId, principal.getUser().getId(), request.getScore(), request.getComment());

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Rating submitted", null));
    }

    @GetMapping("/{id}/ratings/summary")
    public ResponseEntity<ApiResponse<RatingSummaryDto>> getRatingSummary(@PathVariable("id") UUID elderId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewQueryService.getSummary(elderId)));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<ApiResponse<PagedResponse<ReviewResponseDto>>> getReviews(
            @PathVariable("id") UUID elderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        return ResponseEntity.ok(ApiResponse.ok(reviewQueryService.getReviews(elderId, pageable)));
    }
}
