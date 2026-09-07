package lk.ac.sliit.legacylens.admin.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.admin.dto.AdminOpportunityResponse;
import lk.ac.sliit.legacylens.admin.dto.CreateOpportunityRequest;
import lk.ac.sliit.legacylens.admin.dto.OpportunityAudioResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateOpportunityStatusRequest;
import lk.ac.sliit.legacylens.admin.service.AdminOpportunityService;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/opportunities")
public class AdminOpportunityController {

    private final AdminOpportunityService adminOpportunityService;

    public AdminOpportunityController(AdminOpportunityService adminOpportunityService) {
        this.adminOpportunityService = adminOpportunityService;
    }

    @GetMapping("/audios")
    public ResponseEntity<ApiResponse<List<OpportunityAudioResponse>>> getAudioSubmissions(
            @RequestParam(required = false, defaultValue = "ALL") String status) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminOpportunityService.getAudioSubmissions(status)));
    }

    @GetMapping("/audios/{id}")
    public ResponseEntity<ApiResponse<OpportunityAudioResponse>> getAudioSubmission(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminOpportunityService.getAudioSubmission(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminOpportunityResponse>> createOpportunity(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateOpportunityRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminOpportunityService.createOpportunity(request)));
    }

    @PostMapping("/audios/{audioId}/publish")
    public ResponseEntity<ApiResponse<AdminOpportunityResponse>> publishFromAudio(
            @PathVariable String audioId,
            @Valid @RequestBody CreateOpportunityRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminOpportunityService.publishFromAudio(audioId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminOpportunityResponse>>> getAllOpportunities(
            @RequestParam(required = false, defaultValue = "ALL") String status) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminOpportunityService.getAllOpportunities(status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminOpportunityResponse>> getOpportunity(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminOpportunityService.getOpportunity(id)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminOpportunityResponse>> updateOpportunityStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateOpportunityStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminOpportunityService.updateOpportunityStatus(id, request)));
    }
}
