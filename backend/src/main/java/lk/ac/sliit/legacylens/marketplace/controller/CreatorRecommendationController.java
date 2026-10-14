package lk.ac.sliit.legacylens.marketplace.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityRecommendationsResponse;
import lk.ac.sliit.legacylens.marketplace.service.CreatorRecommendationService;
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
 * Elder-side creator recommendations — backs the Content Creator
 * Recommendation screen ("Hire a Creator" in the elder drawer). Every
 * endpoint is scoped to opportunities the caller owns. Requires a valid
 * Bearer token, same as every other marketplace endpoint.
 */
@RestController
@RequestMapping("/api/opportunities")
public class CreatorRecommendationController {

    private final CreatorRecommendationService creatorRecommendationService;

    public CreatorRecommendationController(CreatorRecommendationService creatorRecommendationService) {
        this.creatorRecommendationService = creatorRecommendationService;
    }

    /** One section per open opportunity of the signed-in elder: best match, other matches, and any creator already chosen. */
    @GetMapping("/mine/recommended-creators")
    public ResponseEntity<ApiResponse<List<OpportunityRecommendationsResponse>>> getMyRecommendations(
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.ok(
                creatorRecommendationService.getMyRecommendations(principal.getUser().getId())));
    }

    /** Approves the creator's application if they already applied; otherwise invites them. */
    @PostMapping("/{opportunityId}/recommended-creators/{creatorId}/choose")
    public ResponseEntity<ApiResponse<Void>> chooseCreator(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID opportunityId,
            @PathVariable UUID creatorId) {

        creatorRecommendationService.chooseCreator(principal.getUser().getId(), opportunityId, creatorId);
        return ResponseEntity.ok(ApiResponse.ok("Creator chosen", null));
    }
}
