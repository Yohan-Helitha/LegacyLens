package lk.ac.sliit.legacylens.marketplace.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorProfileResponse;
import lk.ac.sliit.legacylens.marketplace.service.CreatorProfileViewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Content creator profile pages. /me is the creator's own page and includes
 * their private details; /{userId} is how anyone else sees a verified creator,
 * without contact details, NIC or documents. Requires a valid Bearer token.
 */
@RestController
@RequestMapping("/api/creators")
public class CreatorProfileController {

    private final CreatorProfileViewService profileViewService;

    public CreatorProfileController(CreatorProfileViewService profileViewService) {
        this.profileViewService = profileViewService;
    }

    @GetMapping("/me/profile")
    public ResponseEntity<ApiResponse<CreatorProfileResponse>> myProfile(
            @AuthenticationPrincipal CustomUserDetails principal) {

        UUID me = principal.getUser().getId();
        return ResponseEntity.ok(ApiResponse.ok(profileViewService.getProfile(me, me)));
    }

    @GetMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<CreatorProfileResponse>> profileOf(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID userId) {

        return ResponseEntity.ok(ApiResponse.ok(profileViewService.getProfile(principal.getUser().getId(), userId)));
    }
}
