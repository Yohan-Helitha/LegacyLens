package lk.ac.sliit.legacylens.users.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.dto.AuthResponse;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.users.dto.ConfirmStorytellerUpgradeRequest;
import lk.ac.sliit.legacylens.users.dto.StorytellerPreferencesRequest;
import lk.ac.sliit.legacylens.users.service.StorytellerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * "Become a Storyteller" role upgrade — a two-step request/confirm pair
 * gated by an OTP, same shape as AccountSecurityController. Always acts on
 * the caller's own account (from the JWT principal), never a request body.
 */
@RestController
@RequestMapping("/api/users/me/storyteller")
public class StorytellerController {

    private final StorytellerService storytellerService;

    public StorytellerController(StorytellerService storytellerService) {
        this.storytellerService = storytellerService;
    }

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<Void>> requestUpgrade(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody StorytellerPreferencesRequest request) {

        storytellerService.requestUpgrade(principal.getUser().getId(), request);

        return ResponseEntity.ok(ApiResponse.ok("An OTP has been sent to your phone number.", null));
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<AuthResponse>> confirmUpgrade(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody ConfirmStorytellerUpgradeRequest request) {

        AuthResponse response = storytellerService.confirmUpgrade(
                principal.getUser().getId(), request.getOtpCode());

        return ResponseEntity.ok(ApiResponse.ok("You're now a storyteller.", response));
    }
}
