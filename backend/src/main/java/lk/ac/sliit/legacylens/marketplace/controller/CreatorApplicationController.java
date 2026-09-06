package lk.ac.sliit.legacylens.marketplace.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationRequest;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.service.CreatorApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * "Become a Content Creator" application flow.
 * Every endpoint here requires a valid Bearer token — see SecurityConfig,
 * only /api/auth/** and /api/cities/** are public.
 */
@RestController
@RequestMapping("/api/creator-applications")
public class CreatorApplicationController {

    private final CreatorApplicationService creatorApplicationService;

    public CreatorApplicationController(CreatorApplicationService creatorApplicationService) {
        this.creatorApplicationService = creatorApplicationService;
    }

    /** Submits the application. multipart/form-data — the proof file rides alongside the form fields. */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<CreatorApplicationResponse>> submit(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute CreatorApplicationRequest request) {

        CreatorApplicationResponse response = creatorApplicationService.submitApplication(
                principal.getUser().getId(), request);

        return ResponseEntity.ok(ApiResponse.ok("Application submitted for review", response));
    }

    /** Backs the verification-pending screen — lets the app poll the current review status. */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CreatorApplicationResponse>> getMyApplication(
            @AuthenticationPrincipal CustomUserDetails principal) {

        CreatorApplicationResponse response = creatorApplicationService.getMyApplication(
                principal.getUser().getId());

        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
