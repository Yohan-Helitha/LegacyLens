package lk.ac.sliit.legacylens.users.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.users.dto.ConfirmNicChangeRequest;
import lk.ac.sliit.legacylens.users.dto.ConfirmPhoneChangeRequest;
import lk.ac.sliit.legacylens.users.dto.ConfirmPinChangeRequest;
import lk.ac.sliit.legacylens.users.dto.RequestNicChangeRequest;
import lk.ac.sliit.legacylens.users.dto.RequestPhoneChangeRequest;
import lk.ac.sliit.legacylens.users.service.AccountSecurityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authenticated self-service changes to phone number, NIC, and PIN — each a
 * two-step request/confirm pair gated by an OTP. See AccountSecurityService
 * for exactly where each OTP is sent. The user always comes from the JWT
 * principal, never the request body — these endpoints only ever act on the
 * caller's own account.
 */
@RestController
@RequestMapping("/api/users/me")
public class AccountSecurityController {

    private final AccountSecurityService accountSecurityService;

    public AccountSecurityController(AccountSecurityService accountSecurityService) {
        this.accountSecurityService = accountSecurityService;
    }

    @PostMapping("/phone/request-change")
    public ResponseEntity<ApiResponse<Void>> requestPhoneChange(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody RequestPhoneChangeRequest request) {

        accountSecurityService.requestPhoneChange(principal.getUser().getId(), request.getNewPhoneNumber());

        return ResponseEntity.ok(ApiResponse.ok("An OTP has been sent to your new phone number.", null));
    }

    @PostMapping("/phone/confirm-change")
    public ResponseEntity<ApiResponse<Void>> confirmPhoneChange(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody ConfirmPhoneChangeRequest request) {

        accountSecurityService.confirmPhoneChange(
                principal.getUser().getId(), request.getNewPhoneNumber(), request.getOtpCode());

        return ResponseEntity.ok(ApiResponse.ok("Phone number updated.", null));
    }

    @PostMapping("/nic/request-change")
    public ResponseEntity<ApiResponse<Void>> requestNicChange(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody RequestNicChangeRequest request) {

        accountSecurityService.requestNicChange(principal.getUser().getId(), request.getNewNicNumber());

        return ResponseEntity.ok(ApiResponse.ok("An OTP has been sent to your phone number.", null));
    }

    @PostMapping("/nic/confirm-change")
    public ResponseEntity<ApiResponse<Void>> confirmNicChange(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody ConfirmNicChangeRequest request) {

        accountSecurityService.confirmNicChange(
                principal.getUser().getId(), request.getNewNicNumber(), request.getOtpCode());

        return ResponseEntity.ok(ApiResponse.ok("NIC number updated.", null));
    }

    @PostMapping("/pin/request-change")
    public ResponseEntity<ApiResponse<Void>> requestPinChange(
            @AuthenticationPrincipal CustomUserDetails principal) {

        accountSecurityService.requestPinChange(principal.getUser().getId());

        return ResponseEntity.ok(ApiResponse.ok("An OTP has been sent to your phone number.", null));
    }

    @PostMapping("/pin/confirm-change")
    public ResponseEntity<ApiResponse<Void>> confirmPinChange(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody ConfirmPinChangeRequest request) {

        accountSecurityService.confirmPinChange(
                principal.getUser().getId(), request.getNewPin(), request.getConfirmNewPin(), request.getOtpCode());

        return ResponseEntity.ok(ApiResponse.ok("PIN updated.", null));
    }
}
