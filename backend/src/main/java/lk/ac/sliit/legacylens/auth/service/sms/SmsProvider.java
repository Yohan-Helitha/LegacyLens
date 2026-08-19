package lk.ac.sliit.legacylens.auth.service.sms;

/**
 * Abstraction over "however we deliver an OTP to a phone number".
 *
 * This is the Dependency Inversion piece: OtpService depends on this
 * interface, never on a concrete gateway. To go live with a real provider
 * later (Twilio, Dialog, Notify.lk...), add one new class that implements
 * this interface — nothing else in the auth module changes.
 */
public interface SmsProvider {

    void sendOtp(String phoneNumber, String otpCode);
}
