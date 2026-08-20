package lk.ac.sliit.legacylens.auth.service;

import lk.ac.sliit.legacylens.auth.entity.OtpPurpose;

public interface OtpService {

    /** Generates a code, stores it hashed, and sends it via SmsProvider. */
    void issueOtp(String phoneNumber, OtpPurpose purpose);

    /** Validates a submitted code and consumes it. Throws if missing, expired, wrong, or over-attempted. */
    void verifyOtp(String phoneNumber, String otpCode, OtpPurpose purpose);

    /**
     * Same validation as verifyOtp, but does NOT consume the code — for flows
     * that need to confirm a code is right before a later step performs the
     * real (consuming) verification, e.g. PIN reset's OTP-entry screen.
     */
    void checkOtp(String phoneNumber, String otpCode, OtpPurpose purpose);
}
