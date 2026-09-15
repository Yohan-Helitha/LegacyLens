package lk.ac.sliit.legacylens.admin.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.admin.dto.AdminUserVerificationResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateUserVerificationRequest;
import lk.ac.sliit.legacylens.admin.service.AdminUserVerificationService;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/verifications")
public class AdminUserVerificationController {

    private final AdminUserVerificationService adminUserVerificationService;

    public AdminUserVerificationController(AdminUserVerificationService adminUserVerificationService) {
        this.adminUserVerificationService = adminUserVerificationService;
    }

    /**
     * Get all users with roles and verification details.
     * Optional filter by role (e.g., 'ELDER', 'YOUTH_CREATOR', 'Artisan',
     * 'Historian') and status.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminUserVerificationResponse>>> getAllVerifications(
            @RequestParam(required = false, defaultValue = "ALL") String role,
            @RequestParam(required = false, defaultValue = "ALL") String status) {
        List<AdminUserVerificationResponse> responses = adminUserVerificationService.getAllVerifications(role, status);
        return ResponseEntity.ok(ApiResponse.ok("User verifications fetched successfully", responses));
    }

    /**
     * Get single user verification profile by user ID.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<AdminUserVerificationResponse>> getVerificationByUserId(
            @PathVariable UUID userId) {
        AdminUserVerificationResponse response = adminUserVerificationService.getVerificationByUserId(userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Update user verification status and roles.
     */
    @PatchMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<AdminUserVerificationResponse>> updateVerificationStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserVerificationRequest request) {
        AdminUserVerificationResponse response = adminUserVerificationService.updateVerificationStatus(userId, request);
        return ResponseEntity.ok(ApiResponse.ok("User verification status updated successfully", response));
    }

    /**
     * Approve user verification.
     */
    @PostMapping("/{userId}/approve")
    public ResponseEntity<ApiResponse<AdminUserVerificationResponse>> approveUser(
            @PathVariable UUID userId,
            @RequestParam(required = false) String note) {
        AdminUserVerificationResponse response = adminUserVerificationService.approveUser(userId, note);
        return ResponseEntity.ok(ApiResponse.ok("User profile verified and role activated successfully", response));
    }

    /**
     * Reject user verification.
     */
    @PostMapping("/{userId}/reject")
    public ResponseEntity<ApiResponse<AdminUserVerificationResponse>> rejectUser(
            @PathVariable UUID userId,
            @RequestParam(required = false) String reason) {
        AdminUserVerificationResponse response = adminUserVerificationService.rejectUser(userId, reason);
        return ResponseEntity.ok(ApiResponse.ok("User verification rejected", response));
    }

    /**
     * Suspend user account.
     */
    @PostMapping("/{userId}/suspend")
    public ResponseEntity<ApiResponse<AdminUserVerificationResponse>> suspendUser(
            @PathVariable UUID userId,
            @RequestParam(required = false) String reason) {
        AdminUserVerificationResponse response = adminUserVerificationService.suspendUser(userId, reason);
        return ResponseEntity.ok(ApiResponse.ok("User account suspended successfully", response));
    }

    /**
     * Reactivate suspended user account.
     */
    @PostMapping("/{userId}/reactivate")
    public ResponseEntity<ApiResponse<AdminUserVerificationResponse>> reactivateUser(
            @PathVariable UUID userId) {
        AdminUserVerificationResponse response = adminUserVerificationService.reactivateUser(userId);
        return ResponseEntity.ok(ApiResponse.ok("User account reactivated successfully", response));
    }

    /**
     * Delete user permanently.
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable UUID userId) {
        adminUserVerificationService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.ok("User deleted successfully", null));
    }
}
