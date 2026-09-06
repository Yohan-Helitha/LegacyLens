package lk.ac.sliit.legacylens.marketplace.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityCardResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityDetailResponse;
import lk.ac.sliit.legacylens.marketplace.service.OpportunityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Read-only for OpportunityPage / OpportunityDetailPage. Every opportunity
 * here was published by an admin (see Opportunity's javadoc for the full
 * intended workflow) — this controller never creates or edits one.
 * Requires a valid Bearer token — see SecurityConfig, only /api/auth/** and
 * /api/cities/** are public.
 */
@RestController
@RequestMapping("/api/opportunities")
public class OpportunityController {

    private final OpportunityService opportunityService;

    public OpportunityController(OpportunityService opportunityService) {
        this.opportunityService = opportunityService;
    }

    @GetMapping("/recommended")
    public ResponseEntity<ApiResponse<List<OpportunityCardResponse>>> getRecommended(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(defaultValue = "3") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(
                opportunityService.getRecommended(limit, principal.getUser().getId())));
    }

    @GetMapping("/urgent")
    public ResponseEntity<ApiResponse<List<OpportunityCardResponse>>> getUrgent(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(defaultValue = "3") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(
                opportunityService.getUrgent(limit, principal.getUser().getId())));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<OpportunityCardResponse>>> getRecent(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(
                opportunityService.getRecent(limit, principal.getUser().getId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OpportunityDetailResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(opportunityService.getById(id)));
    }
}
