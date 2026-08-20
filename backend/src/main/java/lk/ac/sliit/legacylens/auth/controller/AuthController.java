package lk.ac.sliit.legacylens.auth.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.dto.AuthResponse;
import lk.ac.sliit.legacylens.auth.dto.ForgotPinRequest;
import lk.ac.sliit.legacylens.auth.dto.LoginRequest;
import lk.ac.sliit.legacylens.auth.dto.RegisterRequest;
import lk.ac.sliit.legacylens.auth.dto.RegisterResponse;
import lk.ac.sliit.legacylens.auth.dto.ResendOtpRequest;
import lk.ac.sliit.legacylens.auth.dto.ResetPinRequest;
import lk.ac.sliit.legacylens.auth.dto.VerifyOtpRequest;
import lk.ac.sliit.legacylens.auth.service.AuthService;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public auth endpoints — all permitted without a token (see SecurityConfig).
 * Thin by design: validates input via @Valid, delegates everything to AuthService.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registration successful", response));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifyOtpAndActivate(request);

        return ResponseEntity.ok(ApiResponse.ok("Phone number verified", response));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        authService.resendOtp(request);

        return ResponseEntity.ok(ApiResponse.ok("OTP resent", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);

        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/forgot-pin")
    public ResponseEntity<ApiResponse<Void>> forgotPin(@Valid @RequestBody ForgotPinRequest request) {
        authService.forgotPin(request);

        return ResponseEntity.ok(ApiResponse.ok("An OTP has been sent to your phone number.", null));
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<ApiResponse<Void>> verifyResetOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyResetOtp(request);

        return ResponseEntity.ok(ApiResponse.ok("OTP verified", null));
    }

    @PostMapping("/reset-pin")
    public ResponseEntity<ApiResponse<AuthResponse>> resetPin(@Valid @RequestBody ResetPinRequest request) {
        AuthResponse response = authService.resetPin(request);

        return ResponseEntity.ok(ApiResponse.ok("PIN reset successful", response));
    }
}
