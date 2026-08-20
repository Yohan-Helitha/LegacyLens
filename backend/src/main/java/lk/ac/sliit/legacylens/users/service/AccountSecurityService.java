package lk.ac.sliit.legacylens.users.service;

import java.util.UUID;

/**
 * Handles authenticated changes to security-sensitive account fields — phone
 * number, NIC, PIN — each gated by an OTP. Kept separate from
 * UserProfileService (read-only) and AuthService (unauthenticated
 * login/registration/forgot-pin) since this owns a distinct concern:
 * mutating an already-authenticated user's own credentials.
 */
public interface AccountSecurityService {

    void requestPhoneChange(UUID userId, String newPhoneNumber);

    void confirmPhoneChange(UUID userId, String newPhoneNumber, String otpCode);

    void requestNicChange(UUID userId, String newNicNumber);

    void confirmNicChange(UUID userId, String newNicNumber, String otpCode);

    void requestPinChange(UUID userId);

    void confirmPinChange(UUID userId, String newPin, String confirmNewPin, String otpCode);
}
