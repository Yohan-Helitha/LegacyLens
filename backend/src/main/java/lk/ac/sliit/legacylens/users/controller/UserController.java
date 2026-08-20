package lk.ac.sliit.legacylens.users.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.users.dto.UserProfileResponse;
import lk.ac.sliit.legacylens.users.service.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
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
}
