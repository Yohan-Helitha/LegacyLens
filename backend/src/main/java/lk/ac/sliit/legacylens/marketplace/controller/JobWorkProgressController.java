package lk.ac.sliit.legacylens.marketplace.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.UpdateChecklistItemRequest;
import lk.ac.sliit.legacylens.marketplace.dto.UpdateWorkNoteRequest;
import lk.ac.sliit.legacylens.marketplace.dto.WorkProgressResponse;
import lk.ac.sliit.legacylens.marketplace.service.JobWorkProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * The Prep -> Record -> Edit -> Submit workspace behind MyWorkList and
 * ContinueMyWorkPage — every endpoint is scoped to a specific Job the caller
 * owns (see JobRepository#findByIdAndCreatorId). Requires a valid Bearer
 * token, same as every other marketplace endpoint.
 */
@RestController
@RequestMapping("/api/jobs/{jobId}/work-progress")
public class JobWorkProgressController {

    private final JobWorkProgressService jobWorkProgressService;

    public JobWorkProgressController(JobWorkProgressService jobWorkProgressService) {
        this.jobWorkProgressService = jobWorkProgressService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<WorkProgressResponse>> getProgress(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobId) {

        return ResponseEntity.ok(ApiResponse.ok(
                jobWorkProgressService.getProgress(principal.getUser().getId(), jobId)));
    }

    /** Checks/unchecks one required task — the only action that ever changes progressPercentage. */
    @PatchMapping("/checklist/{checklistItemId}")
    public ResponseEntity<ApiResponse<WorkProgressResponse>> updateChecklistItem(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobId,
            @PathVariable UUID checklistItemId,
            @Valid @RequestBody UpdateChecklistItemRequest request) {

        return ResponseEntity.ok(ApiResponse.ok(
                jobWorkProgressService.updateChecklistItem(
                        principal.getUser().getId(), jobId, checklistItemId,
                        request.getCompleted(), request.getNote())));
    }

    @PutMapping("/note")
    public ResponseEntity<ApiResponse<WorkProgressResponse>> updateNote(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobId,
            @Valid @RequestBody UpdateWorkNoteRequest request) {

        return ResponseEntity.ok(ApiResponse.ok(
                jobWorkProgressService.updateNote(principal.getUser().getId(), jobId, request.getNote())));
    }

    @PostMapping(value = "/materials", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<WorkProgressResponse>> addMaterial(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobId,
            @RequestParam("file") MultipartFile file) {

        return ResponseEntity.ok(ApiResponse.ok(
                jobWorkProgressService.addMaterial(principal.getUser().getId(), jobId, file)));
    }

    @DeleteMapping("/materials/{materialId}")
    public ResponseEntity<ApiResponse<WorkProgressResponse>> removeMaterial(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobId,
            @PathVariable UUID materialId) {

        return ResponseEntity.ok(ApiResponse.ok(
                jobWorkProgressService.removeMaterial(principal.getUser().getId(), jobId, materialId)));
    }

    /** Flags the current progress as an explicit draft — shown on SavedCompletedWorkPage. Never touches the checklist. */
    @PostMapping("/draft")
    public ResponseEntity<ApiResponse<WorkProgressResponse>> markDraft(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobId) {

        return ResponseEntity.ok(ApiResponse.ok(
                jobWorkProgressService.markDraft(principal.getUser().getId(), jobId)));
    }

    /** Finalises a draft for review — clears the draft flag and moves the job into MyWorkList's "Submitted" tab. */
    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<WorkProgressResponse>> submitDraft(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobId) {

        return ResponseEntity.ok(ApiResponse.ok(
                jobWorkProgressService.submitDraft(principal.getUser().getId(), jobId)));
    }

    /** Discards all progress, materials, notes and checklist completion for this job. */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> resetProgress(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID jobId) {

        jobWorkProgressService.resetProgress(principal.getUser().getId(), jobId);
        return ResponseEntity.ok(ApiResponse.ok("Progress reset", null));
    }
}
