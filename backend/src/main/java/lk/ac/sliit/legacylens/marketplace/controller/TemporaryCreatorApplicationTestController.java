package lk.ac.sliit.legacylens.marketplace.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.service.CreatorApplicationReviewService;
import lk.ac.sliit.legacylens.marketplace.service.CreatorApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * TEMPORARY - lets an applicant stand in for the admin on their own "Become a Content Creator" application,
 * so the approved / not-approved paths can be tried before the admin screen exists. It goes through exactly
 * the same service the real admin endpoints use. Remove it once the admin screen exists.
 */
@RestController
@RequestMapping("/api/creator-applications/me/test")
public class TemporaryCreatorApplicationTestController {

    private static final String SAMPLE_REASON = "The proof document could not be read. (test reason)";

    private final CreatorApplicationRepository applicationRepository;
    private final CreatorApplicationReviewService reviewService;
    private final CreatorApplicationService applicationService;

    public TemporaryCreatorApplicationTestController(
            CreatorApplicationRepository applicationRepository,
            CreatorApplicationReviewService reviewService,
            CreatorApplicationService applicationService) {
        this.applicationRepository = applicationRepository;
        this.reviewService = reviewService;
        this.applicationService = applicationService;
    }

    /** {@code action} is "approve" or "reject". */
    @PostMapping("/{action}")
    public ResponseEntity<ApiResponse<CreatorApplicationResponse>> decide(
            @AuthenticationPrincipal CustomUserDetails principal, @PathVariable String action) {

        CreatorApplication application = applicationRepository.findByUserId(principal.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("No creator application found"));

        switch (action) {
            case "approve" -> reviewService.approve(application.getId(), "Approved (test)");
            case "reject" -> reviewService.reject(application.getId(), SAMPLE_REASON);
            default -> throw new InvalidRequestException("Unknown action: " + action);
        }
        return ResponseEntity.ok(ApiResponse.ok("Decision recorded",
                applicationService.getMyApplication(principal.getUser().getId())));
    }
}
