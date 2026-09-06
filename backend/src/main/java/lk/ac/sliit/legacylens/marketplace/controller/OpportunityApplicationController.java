package lk.ac.sliit.legacylens.marketplace.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationRequest;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.service.OpportunityApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * "Apply to Opportunity" flow — backs OpportunityApplicationForm and
 * SavedOpportunityApplication. Every endpoint requires a valid Bearer token
 * — see SecurityConfig, only /api/auth/** and /api/cities/** are public.
 */
@RestController
@RequestMapping("/api/opportunity-applications")
public class OpportunityApplicationController {

    private final OpportunityApplicationService opportunityApplicationService;

    public OpportunityApplicationController(OpportunityApplicationService opportunityApplicationService) {
        this.opportunityApplicationService = opportunityApplicationService;
    }

    /** Creates a new draft, or updates the caller's existing draft for that opportunity — the form's Save button. */
    @PostMapping
    public ResponseEntity<ApiResponse<OpportunityApplicationResponse>> saveDraft(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody OpportunityApplicationRequest request) {

        OpportunityApplicationResponse response = opportunityApplicationService.saveDraft(
                principal.getUser().getId(), request);

        return ResponseEntity.ok(ApiResponse.ok("Application saved", response));
    }

    /** Backs SavedOpportunityApplication's Saved + Submitted sections. */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<OpportunityApplicationResponse>>> getMyApplications(
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.ok(
                opportunityApplicationService.getMyApplications(principal.getUser().getId())));
    }

    /**
     * Lets OpportunityApplicationForm check for an existing draft when
     * opening "Apply" for an opportunity — data is null (not a 404) when the
     * creator hasn't saved anything for it yet, since that's the normal
     * first-time state, not an error.
     */
    @GetMapping("/by-opportunity/{opportunityId}")
    public ResponseEntity<ApiResponse<OpportunityApplicationResponse>> getByOpportunity(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID opportunityId) {

        OpportunityApplicationResponse response = opportunityApplicationService
                .getByOpportunity(principal.getUser().getId(), opportunityId)
                .orElse(null);

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /** Moves a saved draft to PENDING — the Submit button. */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<OpportunityApplicationResponse>> submit(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID id) {

        OpportunityApplicationResponse response = opportunityApplicationService.submitApplication(
                principal.getUser().getId(), id);

        return ResponseEntity.ok(ApiResponse.ok("Application submitted", response));
    }

    /** Deletes a draft or a submitted application — the Delete/Cancel action. */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID id) {

        opportunityApplicationService.deleteApplication(principal.getUser().getId(), id);

        return ResponseEntity.ok(ApiResponse.ok("Application deleted", null));
    }
}
