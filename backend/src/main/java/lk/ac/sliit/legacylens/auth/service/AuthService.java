package lk.ac.sliit.legacylens.auth.service;

import lk.ac.sliit.legacylens.auth.dto.AuthResponse;
import lk.ac.sliit.legacylens.auth.dto.ForgotPinRequest;
import lk.ac.sliit.legacylens.auth.dto.LoginRequest;
import lk.ac.sliit.legacylens.auth.dto.RegisterRequest;
import lk.ac.sliit.legacylens.auth.dto.RegisterResponse;
import lk.ac.sliit.legacylens.auth.dto.ResendOtpRequest;
import lk.ac.sliit.legacylens.auth.dto.ResetPinRequest;
import lk.ac.sliit.legacylens.auth.dto.VerifyOtpRequest;

public interface AuthService {

    RegisterResponse register(RegisterRequest request);

    AuthResponse verifyOtpAndActivate(VerifyOtpRequest request);

    void resendOtp(ResendOtpRequest request);

    AuthResponse login(LoginRequest request);

    /** Always behaves identically whether or not the phone number is registered. */
    void forgotPin(ForgotPinRequest request);

    /** Verifies the reset OTP, sets the new PIN, and logs the user straight in. */
    AuthResponse resetPin(ResetPinRequest request);
}
