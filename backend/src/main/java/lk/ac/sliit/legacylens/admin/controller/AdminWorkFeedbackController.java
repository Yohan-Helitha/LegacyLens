package lk.ac.sliit.legacylens.admin.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkFeedbackRequest;
import lk.ac.sliit.legacylens.marketplace.dto.WorkFeedbackResponse;
import lk.ac.sliit.legacylens.marketplace.service.WorkFeedbackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * The admin's side of the review: read what the knowledge holder asked for, and send the work back
 * with their own note. Under /api/admin, so only admins reach it.
 */
@RestController
@RequestMapping("/api/admin/work-feedback/jobs/{jobId}")
public class AdminWorkFeedbackController {

    private final WorkFeedbackService feedbackService;

    public AdminWorkFeedbackController(WorkFeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    /** Both the knowledge holder's note and the admin's own. */
    @GetMapping
    public ResponseEntity<ApiResponse<WorkFeedbackResponse>> get(@PathVariable UUID jobId) {
        return ResponseEntity.ok(ApiResponse.ok(feedbackService.adminView(jobId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkFeedbackResponse>> leave(
            @PathVariable UUID jobId, @Valid @RequestBody WorkFeedbackRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Feedback sent to the creator",
                feedbackService.leaveAdminFeedback(jobId, request.getMessage())));
    }
}
