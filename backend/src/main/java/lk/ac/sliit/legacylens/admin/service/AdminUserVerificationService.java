package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminUserVerificationResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateUserVerificationRequest;

import java.util.List;
import java.util.UUID;

public interface AdminUserVerificationService {

    /**
     * Retrieve all users with their roles and verification information.
     * Excludes administrative accounts.
     *
     * @param roleFilter   Optional filter by role type (e.g., "ELDER", "YOUTH_CREATOR", "ALL")
     * @param statusFilter Optional filter by status (e.g., "PENDING", "VERIFIED", "REJECTED", "ACTIVE", "ALL")
     * @return List of user verification responses
     */
    List<AdminUserVerificationResponse> getAllVerifications(String roleFilter, String statusFilter);

    /**
     * Retrieve single user verification profile by user ID.
     *
     * @param userId The UUID of the user
     * @return Detailed user verification response
     */
    AdminUserVerificationResponse getVerificationByUserId(UUID userId);

    /**
     * Update verification status / activate user role.
     *
     * @param userId  The UUID of the user
     * @param request Update request details
     * @return Updated user verification response
     */
    AdminUserVerificationResponse updateVerificationStatus(UUID userId, UpdateUserVerificationRequest request);

    /**
     * Shortcut to approve verification and activate user roles.
     *
     * @param userId          The UUID of the user
     * @param note            Optional audit note
     * @param performedById   ID of the admin performing the action
     * @param performedByName Name of the admin performing the action
     * @return Updated user verification response
     */
    AdminUserVerificationResponse approveUser(UUID userId, String note, String performedById, String performedByName);

    /**
     * Shortcut to reject verification.
     *
     * @param userId          The UUID of the user
     * @param reason          Rejection reason or notes
     * @param performedById   ID of the admin performing the action
     * @param performedByName Name of the admin performing the action
     * @return Updated user verification response
     */
    AdminUserVerificationResponse rejectUser(UUID userId, String reason, String performedById, String performedByName);

    /**
     * Suspend user account and deactivate active roles.
     *
     * @param userId          The UUID of the user
     * @param reason          Suspension reason
     * @param performedById   ID of the admin performing the action
     * @param performedByName Name of the admin performing the action
     * @return Updated user verification response
     */
    AdminUserVerificationResponse suspendUser(UUID userId, String reason, String performedById, String performedByName);

    /**
     * Reactivate a suspended user account.
     *
     * @param userId          The UUID of the user
     * @param performedById   ID of the admin performing the action
     * @param performedByName Name of the admin performing the action
     * @return Updated user verification response
     */
    AdminUserVerificationResponse reactivateUser(UUID userId, String performedById, String performedByName);

    /**
     * Delete user and all associated role entries.
     *
     * @param userId          The UUID of the user
     * @param performedById   ID of the admin performing the action
     * @param performedByName Name of the admin performing the action
     */
    void deleteUser(UUID userId, String performedById, String performedByName);
}
