package lk.ac.sliit.legacylens.admin.controller;

import lk.ac.sliit.legacylens.admin.entity.AuditActionType;
import lk.ac.sliit.legacylens.admin.service.AdminAuditService;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.AdminCreatorApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.service.CreatorApplicationReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Admin review of "Become a Content Creator" applications. Requires the ADMIN role (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin/creator-applications")
public class AdminCreatorApplicationController {

    private static final String ENTITY = "Creator Application";

    private final CreatorApplicationReviewService reviewService;
    private final AdminAuditService auditService;

    public AdminCreatorApplicationController(CreatorApplicationReviewService reviewService, AdminAuditService auditService) {
        this.reviewService = reviewService;
        this.auditService = auditService;
    }

    /** status = ALL (default), PENDING, VERIFIED or REJECTED. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminCreatorApplicationResponse>>> list(
            @RequestParam(required = false, defaultValue = "ALL") String status) {
        return ResponseEntity.ok(ApiResponse.ok("Creator applications fetched", reviewService.list(status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminCreatorApplicationResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.get(id)));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<AdminCreatorApplicationResponse>> approve(
            @PathVariable UUID id,
            @RequestParam(required = false) String note,
            @RequestHeader(value = "X-Admin-Id", defaultValue = "unknown") String adminId,
            @RequestHeader(value = "X-Admin-Name", defaultValue = "Admin") String adminName) {
        AdminCreatorApplicationResponse response = reviewService.approve(id, note);
        auditService.logAction(AuditActionType.APPROVED, ENTITY, id.toString(), response.getFullName(), adminId, adminName, note);
        return ResponseEntity.ok(ApiResponse.ok("Application approved - the applicant is now a creator", response));
    }

    /** The reason is shown to the applicant, so the admin should always give one. */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<AdminCreatorApplicationResponse>> reject(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @RequestHeader(value = "X-Admin-Id", defaultValue = "unknown") String adminId,
            @RequestHeader(value = "X-Admin-Name", defaultValue = "Admin") String adminName) {
        AdminCreatorApplicationResponse response = reviewService.reject(id, reason);
        auditService.logAction(AuditActionType.REJECTED, ENTITY, id.toString(), response.getFullName(), adminId, adminName, reason);
        return ResponseEntity.ok(ApiResponse.ok("Application rejected", response));
    }
}
