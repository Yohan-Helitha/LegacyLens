package lk.ac.sliit.legacylens.auth.entity;

/**
 * What an OTP challenge is being used for.
 * Kept separate from RoleType/AccountStatus since it belongs to the auth
 * module, not the users module.
 */
public enum OtpPurpose {
    REGISTRATION,
    PIN_RESET
}
