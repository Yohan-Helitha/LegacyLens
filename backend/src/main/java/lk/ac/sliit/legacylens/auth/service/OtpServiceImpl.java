package lk.ac.sliit.legacylens.auth.service;

import lk.ac.sliit.legacylens.auth.entity.OtpPurpose;
import lk.ac.sliit.legacylens.auth.entity.OtpVerification;
import lk.ac.sliit.legacylens.auth.repository.OtpVerificationRepository;
import lk.ac.sliit.legacylens.auth.service.sms.SmsProvider;
import lk.ac.sliit.legacylens.common.exception.InvalidOtpException;
import lk.ac.sliit.legacylens.common.exception.OtpCooldownException;
import lk.ac.sliit.legacylens.common.exception.OtpExpiredException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * Owns the OTP lifecycle only: generate, hash, store, send, verify, expire.
 * Knows nothing about users, registration, or JWTs (Single Responsibility).
 */
@Service
public class OtpServiceImpl implements OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpVerificationRepository otpRepository;
    private final SmsProvider smsProvider;
    private final PasswordEncoder passwordEncoder;
    private final int otpLength;
    private final int expiryMinutes;
    private final int maxAttempts;
    private final int resendCooldownSeconds;

    public OtpServiceImpl(
            OtpVerificationRepository otpRepository,
            SmsProvider smsProvider,
            PasswordEncoder passwordEncoder,
            @Value("${app.otp.length:6}") int otpLength,
            @Value("${app.otp.expiry-minutes:5}") int expiryMinutes,
            @Value("${app.otp.max-attempts:5}") int maxAttempts,
            @Value("${app.otp.resend-cooldown-seconds:60}") int resendCooldownSeconds) {

        this.otpRepository = otpRepository;
        this.smsProvider = smsProvider;
        this.passwordEncoder = passwordEncoder;
        this.otpLength = otpLength;
        this.expiryMinutes = expiryMinutes;
        this.maxAttempts = maxAttempts;
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    @Override
    @Transactional
    public void issueOtp(String phoneNumber, OtpPurpose purpose) {
        Optional<OtpVerification> latest = otpRepository
                .findFirstByPhoneNumberAndPurposeAndConsumedFalseOrderByCreatedAtDesc(phoneNumber, purpose);

        latest.ifPresent(this::enforceResendCooldown);
        otpRepository.deleteByPhoneNumberAndPurposeAndConsumedFalse(phoneNumber, purpose);

        String otpCode = generateOtpCode();

        OtpVerification otp = new OtpVerification();
        otp.setPhoneNumber(phoneNumber);
        otp.setOtpHash(passwordEncoder.encode(otpCode));
        otp.setPurpose(purpose);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(expiryMinutes));
        otpRepository.save(otp);

        smsProvider.sendOtp(phoneNumber, otpCode);
    }

    @Override
    @Transactional
    public void verifyOtp(String phoneNumber, String otpCode, OtpPurpose purpose) {
        OtpVerification otp = otpRepository
                .findFirstByPhoneNumberAndPurposeAndConsumedFalseOrderByCreatedAtDesc(phoneNumber, purpose)
                .orElseThrow(() -> new InvalidOtpException("No pending OTP for this phone number"));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new OtpExpiredException("OTP has expired, please request a new one");
        }

        if (otp.getAttemptCount() >= maxAttempts) {
            throw new InvalidOtpException("Too many incorrect attempts, please request a new OTP");
        }

        boolean matches = passwordEncoder.matches(otpCode, otp.getOtpHash());

        if (!matches) {
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            otpRepository.save(otp);

            throw new InvalidOtpException("Incorrect OTP code");
        }

        otp.setConsumed(true);
        otpRepository.save(otp);
    }

    private void enforceResendCooldown(OtpVerification lastOtp) {
        LocalDateTime cooldownEnd = lastOtp.getCreatedAt().plusSeconds(resendCooldownSeconds);

        if (LocalDateTime.now().isBefore(cooldownEnd)) {
            long secondsLeft = ChronoUnit.SECONDS.between(LocalDateTime.now(), cooldownEnd);

            throw new OtpCooldownException("Please wait " + secondsLeft + "s before requesting another OTP");
        }
    }

    private String generateOtpCode() {
        int bound = (int) Math.pow(10, otpLength);
        int code = RANDOM.nextInt(bound);

        return String.format("%0" + otpLength + "d", code);
    }
}
