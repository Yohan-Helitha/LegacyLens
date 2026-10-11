package lk.ac.sliit.legacylens.marketplace.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.marketplace.dto.WorkFeedbackRequest;
import lk.ac.sliit.legacylens.marketplace.dto.WorkFeedbackResponse;
import lk.ac.sliit.legacylens.marketplace.service.WorkFeedbackService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * A knowledge holder's note on work done for them. Ownership comes from the signed-in user: only the
 * job's own knowledge holder finds it, and they only ever get their own note back.
 */
@RestController
@RequestMapping("/api/elder/work-feedback/jobs/{jobId}")
public class ElderWorkFeedbackController {

    private final WorkFeedbackService feedbackService;

    public ElderWorkFeedbackController(WorkFeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<WorkFeedbackResponse>> get(
            @AuthenticationPrincipal CustomUserDetails principal, @PathVariable UUID jobId) {
        return ResponseEntity.ok(ApiResponse.ok(feedbackService.elderView(principal.getUser().getId(), jobId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkFeedbackResponse>> leave(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobId,
            @Valid @RequestBody WorkFeedbackRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Feedback sent to the creator",
                feedbackService.leaveElderFeedback(principal.getUser().getId(), jobId, request.getMessage())));
    }
}
