package lk.ac.sliit.legacylens.auth.service;

import lk.ac.sliit.legacylens.auth.entity.OtpPurpose;
import lk.ac.sliit.legacylens.auth.entity.OtpVerification;
import lk.ac.sliit.legacylens.auth.repository.OtpVerificationRepository;
import lk.ac.sliit.legacylens.auth.service.sms.SmsProvider;
import lk.ac.sliit.legacylens.common.exception.InvalidOtpException;
import lk.ac.sliit.legacylens.common.exception.OtpCooldownException;
import lk.ac.sliit.legacylens.common.exception.OtpExpiredException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for OtpServiceImpl using Mockito to fake the repository,
 * SmsProvider, and PasswordEncoder — no real database or SMS gateway involved.
 */
@ExtendWith(MockitoExtension.class)
class OtpServiceImplTest {

    private static final String PHONE = "+94771234567";
    private static final int OTP_LENGTH = 6;
    private static final int EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 3;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    @Mock
    private OtpVerificationRepository otpRepository;

    @Mock
    private SmsProvider smsProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    private OtpServiceImpl otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpServiceImpl(
                otpRepository, smsProvider, passwordEncoder,
                OTP_LENGTH, EXPIRY_MINUTES, MAX_ATTEMPTS, RESEND_COOLDOWN_SECONDS);
    }

    @Test
    void issueOtp_noPriorOtp_generatesHashesAndSendsCode() {
        when(otpRepository.findFirstByPhoneNumberAndPurposeAndConsumedFalseOrderByCreatedAtDesc(PHONE, OtpPurpose.REGISTRATION))
                .thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-otp");

        otpService.issueOtp(PHONE, OtpPurpose.REGISTRATION);

        ArgumentCaptor<OtpVerification> savedOtp = ArgumentCaptor.forClass(OtpVerification.class);
        verify(otpRepository).save(savedOtp.capture());

        assertThat(savedOtp.getValue().getPhoneNumber()).isEqualTo(PHONE);
        assertThat(savedOtp.getValue().getPurpose()).isEqualTo(OtpPurpose.REGISTRATION);
        assertThat(savedOtp.getValue().getOtpHash()).isEqualTo("hashed-otp");

        ArgumentCaptor<String> sentCode = ArgumentCaptor.forClass(String.class);
        verify(smsProvider).sendOtp(eq(PHONE), sentCode.capture());
        assertThat(sentCode.getValue()).hasSize(OTP_LENGTH);
        assertThat(sentCode.getValue()).matches("\\d{6}");
    }

    @Test
    void issueOtp_oldPendingOtpWithinCooldown_throwsOtpCooldownException() {
        OtpVerification recentOtp = new OtpVerification();
        recentOtp.setCreatedAt(LocalDateTime.now().minusSeconds(10));

        when(otpRepository.findFirstByPhoneNumberAndPurposeAndConsumedFalseOrderByCreatedAtDesc(PHONE, OtpPurpose.REGISTRATION))
                .thenReturn(Optional.of(recentOtp));

        assertThrows(OtpCooldownException.class, () -> otpService.issueOtp(PHONE, OtpPurpose.REGISTRATION));

        verify(otpRepository, never()).save(any());
        verify(smsProvider, never()).sendOtp(anyString(), anyString());
    }

    @Test
    void issueOtp_oldPendingOtpPastCooldown_proceedsNormally() {
        OtpVerification staleOtp = new OtpVerification();
        staleOtp.setCreatedAt(LocalDateTime.now().minusMinutes(10));

        when(otpRepository.findFirstByPhoneNumberAndPurposeAndConsumedFalseOrderByCreatedAtDesc(PHONE, OtpPurpose.REGISTRATION))
                .thenReturn(Optional.of(staleOtp));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-otp");

        otpService.issueOtp(PHONE, OtpPurpose.REGISTRATION);

        verify(otpRepository).deleteByPhoneNumberAndPurposeAndConsumedFalse(PHONE, OtpPurpose.REGISTRATION);
        verify(otpRepository).save(any(OtpVerification.class));
        verify(smsProvider).sendOtp(eq(PHONE), anyString());
    }

    @Test
    void verifyOtp_correctCode_marksOtpConsumed() {
        OtpVerification otp = buildPendingOtp(0);

        when(otpRepository.findFirstByPhoneNumberAndPurposeAndConsumedFalseOrderByCreatedAtDesc(PHONE, OtpPurpose.REGISTRATION))
                .thenReturn(Optional.of(otp));
        when(passwordEncoder.matches("123456", otp.getOtpHash())).thenReturn(true);

        otpService.verifyOtp(PHONE, "123456", OtpPurpose.REGISTRATION);

        assertThat(otp.isConsumed()).isTrue();
        verify(otpRepository).save(otp);
    }

    @Test
    void verifyOtp_noPendingOtp_throwsInvalidOtpException() {
        when(otpRepository.findFirstByPhoneNumberAndPurposeAndConsumedFalseOrderByCreatedAtDesc(PHONE, OtpPurpose.REGISTRATION))
                .thenReturn(Optional.empty());

        assertThrows(InvalidOtpException.class,
                () -> otpService.verifyOtp(PHONE, "123456", OtpPurpose.REGISTRATION));
    }

    @Test
    void verifyOtp_expiredOtp_throwsOtpExpiredException() {
        OtpVerification otp = buildPendingOtp(0);
        otp.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        when(otpRepository.findFirstByPhoneNumberAndPurposeAndConsumedFalseOrderByCreatedAtDesc(PHONE, OtpPurpose.REGISTRATION))
                .thenReturn(Optional.of(otp));

        assertThrows(OtpExpiredException.class,
                () -> otpService.verifyOtp(PHONE, "123456", OtpPurpose.REGISTRATION));
    }

    @Test
    void verifyOtp_tooManyPriorAttempts_throwsInvalidOtpException() {
        OtpVerification otp = buildPendingOtp(MAX_ATTEMPTS);

        when(otpRepository.findFirstByPhoneNumberAndPurposeAndConsumedFalseOrderByCreatedAtDesc(PHONE, OtpPurpose.REGISTRATION))
                .thenReturn(Optional.of(otp));

        assertThrows(InvalidOtpException.class,
                () -> otpService.verifyOtp(PHONE, "123456", OtpPurpose.REGISTRATION));
    }

    @Test
    void verifyOtp_wrongCode_incrementsAttemptCountAndThrows() {
        OtpVerification otp = buildPendingOtp(0);

        when(otpRepository.findFirstByPhoneNumberAndPurposeAndConsumedFalseOrderByCreatedAtDesc(PHONE, OtpPurpose.REGISTRATION))
                .thenReturn(Optional.of(otp));
        when(passwordEncoder.matches("999999", otp.getOtpHash())).thenReturn(false);

        assertThrows(InvalidOtpException.class,
                () -> otpService.verifyOtp(PHONE, "999999", OtpPurpose.REGISTRATION));

        assertThat(otp.getAttemptCount()).isEqualTo(1);
        verify(otpRepository, times(1)).save(otp);
    }

    private OtpVerification buildPendingOtp(int attemptCount) {
        OtpVerification otp = new OtpVerification();
        otp.setPhoneNumber(PHONE);
        otp.setPurpose(OtpPurpose.REGISTRATION);
        otp.setOtpHash("hashed-otp");
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(EXPIRY_MINUTES));
        otp.setAttemptCount(attemptCount);
        otp.setConsumed(false);

        return otp;
    }
}
