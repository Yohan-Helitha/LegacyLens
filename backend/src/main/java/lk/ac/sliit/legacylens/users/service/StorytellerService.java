package lk.ac.sliit.legacylens.users.service;

import lk.ac.sliit.legacylens.auth.dto.AuthResponse;
import lk.ac.sliit.legacylens.users.dto.StorytellerPreferencesRequest;

import java.util.UUID;

/**
 * "Become a Storyteller" role-upgrade flow: answer the two intake questions,
 * then confirm an OTP to actually flip the account over to the ELDER role.
 * Two-step (request/confirm) for the same reason as AccountSecurityService's
 * phone/NIC/PIN changes — the OTP proves it's really the account owner
 * asking, not just a valid session token.
 */
public interface StorytellerService {

    /**
     * Saves the intake answers (PENDING verification) and sends an OTP to
     * the user's current phone number.
     */
    void requestUpgrade(UUID userId, StorytellerPreferencesRequest preferences);

    /**
     * Verifies the OTP, marks the intake answers VERIFIED, and activates the
     * ELDER role. Returns a fresh token — role claims changed, so the
     * client's existing JWT no longer reflects reality.
     */
    AuthResponse confirmUpgrade(UUID userId, String otpCode);
}
