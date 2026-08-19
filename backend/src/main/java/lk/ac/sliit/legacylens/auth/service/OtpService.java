package lk.ac.sliit.legacylens.auth.service;

import lk.ac.sliit.legacylens.auth.entity.OtpPurpose;

public interface OtpService {

    /** Generates a code, stores it hashed, and sends it via SmsProvider. */
    void issueOtp(String phoneNumber, OtpPurpose purpose);

    /** Validates a submitted code. Throws if missing, expired, wrong, or over-attempted. */
    void verifyOtp(String phoneNumber, String otpCode, OtpPurpose purpose);
}
