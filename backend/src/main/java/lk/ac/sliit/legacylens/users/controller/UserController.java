package lk.ac.sliit.legacylens.users.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.users.dto.UpdateProfileRequest;
import lk.ac.sliit.legacylens.users.dto.UserProfileResponse;
import lk.ac.sliit.legacylens.users.service.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Protected endpoints for the logged-in user's own data.
 * Everything here requires a valid Bearer token — see SecurityConfig,
 * only /api/auth/** is public.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserProfileService userProfileService;

    public UserController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails principal) {

        UserProfileResponse profile = userProfileService.getMyProfile(principal.getUser().getId());

        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    /** Updates full name / city — the "Edit Your Details" form. Phone/NIC/PIN stay on their own OTP-verified flow. */
    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateProfileRequest request) {

        UserProfileResponse profile = userProfileService.updateMyProfile(principal.getUser().getId(), request);

        return ResponseEntity.ok(ApiResponse.ok("Profile updated", profile));
    }
}
