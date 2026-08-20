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

    /** Confirms the phone number and NIC belong to the same account, then issues a PIN-reset OTP. */
    void forgotPin(ForgotPinRequest request);

    /** Checks a PIN-reset OTP without consuming it, so the code can still be used by resetPin(). */
    void verifyResetOtp(VerifyOtpRequest request);

    /** Verifies the reset OTP, sets the new PIN, and logs the user straight in. */
    AuthResponse resetPin(ResetPinRequest request);
}
