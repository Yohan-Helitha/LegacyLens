package lk.ac.sliit.legacylens.users.service;

import lk.ac.sliit.legacylens.auth.entity.OtpPurpose;
import lk.ac.sliit.legacylens.auth.service.OtpService;
import lk.ac.sliit.legacylens.common.exception.DuplicateNicException;
import lk.ac.sliit.legacylens.common.exception.DuplicatePhoneNumberException;
import lk.ac.sliit.legacylens.common.exception.PinMismatchException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AccountSecurityServiceImpl. All collaborators are Mockito
 * mocks, mirroring AuthServiceImplTest's structure — no Spring context, no
 * real database.
 */
@ExtendWith(MockitoExtension.class)
class AccountSecurityServiceImplTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final String CURRENT_PHONE = "+94771234567";
    private static final String CURRENT_NIC = "199812345678";
    private static final String NEW_PHONE = "+94779876543";
    private static final String NEW_NIC = "200098765432";
    private static final String OTP_CODE = "123456";
    private static final String NEW_PIN = "5678";

    @Mock
    private UserRepository userRepository;

    @Mock
    private OtpService otpService;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AccountSecurityServiceImpl accountSecurityService;

    @BeforeEach
    void setUp() {
        accountSecurityService = new AccountSecurityServiceImpl(userRepository, otpService, passwordEncoder);
    }

    private User buildUser() {
        User user = new User();
        user.setId(USER_ID);
        user.setFullName("Test User");
        user.setPhoneNumber(CURRENT_PHONE);
        user.setNicNumber(CURRENT_NIC);
        user.setDateOfBirth(LocalDate.of(1998, 1, 1));
        user.setPinHash("old-hash");
        return user;
    }

    // ── phone change ─────────────────────────────────────────────────────

    @Test
    void requestPhoneChange_availableNumber_issuesOtpToNewNumber() {
        User user = buildUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.existsByPhoneNumber(NEW_PHONE)).thenReturn(false);

        accountSecurityService.requestPhoneChange(USER_ID, NEW_PHONE);

        verify(otpService).issueOtp(NEW_PHONE, OtpPurpose.PHONE_CHANGE);
    }

    @Test
    void requestPhoneChange_alreadyTaken_throwsAndNeverSendsOtp() {
        User user = buildUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.existsByPhoneNumber(NEW_PHONE)).thenReturn(true);

        assertThrows(DuplicatePhoneNumberException.class,
                () -> accountSecurityService.requestPhoneChange(USER_ID, NEW_PHONE));

        verify(otpService, never()).issueOtp(anyString(), any(OtpPurpose.class));
    }

    @Test
    void requestPhoneChange_sameAsCurrent_throwsAndNeverSendsOtp() {
        User user = buildUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        assertThrows(DuplicatePhoneNumberException.class,
                () -> accountSecurityService.requestPhoneChange(USER_ID, CURRENT_PHONE));

        verify(otpService, never()).issueOtp(anyString(), any(OtpPurpose.class));
    }

    @Test
    void confirmPhoneChange_validOtp_updatesPhoneNumber() {
        User user = buildUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.existsByPhoneNumber(NEW_PHONE)).thenReturn(false);

        accountSecurityService.confirmPhoneChange(USER_ID, NEW_PHONE, OTP_CODE);

        verify(otpService).verifyOtp(NEW_PHONE, OTP_CODE, OtpPurpose.PHONE_CHANGE);
        assertThat(user.getPhoneNumber()).isEqualTo(NEW_PHONE);
        verify(userRepository).save(user);
    }

    // ── NIC change ────────────────────────────────────────────────────────

    @Test
    void requestNicChange_availableNic_issuesOtpToCurrentPhone() {
        User user = buildUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.existsByNicNumber(NEW_NIC)).thenReturn(false);

        accountSecurityService.requestNicChange(USER_ID, NEW_NIC);

        // Sent to the CURRENT phone, not the new NIC — NIC numbers can't receive SMS.
        verify(otpService).issueOtp(CURRENT_PHONE, OtpPurpose.NIC_CHANGE);
    }

    @Test
    void requestNicChange_alreadyTaken_throwsAndNeverSendsOtp() {
        User user = buildUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.existsByNicNumber(NEW_NIC)).thenReturn(true);

        assertThrows(DuplicateNicException.class,
                () -> accountSecurityService.requestNicChange(USER_ID, NEW_NIC));

        verify(otpService, never()).issueOtp(anyString(), any(OtpPurpose.class));
    }

    @Test
    void confirmNicChange_validOtp_updatesNicNumber() {
        User user = buildUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.existsByNicNumber(NEW_NIC)).thenReturn(false);

        accountSecurityService.confirmNicChange(USER_ID, NEW_NIC, OTP_CODE);

        verify(otpService).verifyOtp(CURRENT_PHONE, OTP_CODE, OtpPurpose.NIC_CHANGE);
        assertThat(user.getNicNumber()).isEqualTo(NEW_NIC);
        verify(userRepository).save(user);
    }

    // ── PIN change ────────────────────────────────────────────────────────

    @Test
    void requestPinChange_issuesOtpToCurrentPhone() {
        User user = buildUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        accountSecurityService.requestPinChange(USER_ID);

        verify(otpService).issueOtp(CURRENT_PHONE, OtpPurpose.PIN_CHANGE);
    }

    @Test
    void confirmPinChange_matchingPins_updatesPinHash() {
        User user = buildUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(NEW_PIN)).thenReturn("new-hash");

        accountSecurityService.confirmPinChange(USER_ID, NEW_PIN, NEW_PIN, OTP_CODE);

        verify(otpService).verifyOtp(CURRENT_PHONE, OTP_CODE, OtpPurpose.PIN_CHANGE);
        assertThat(user.getPinHash()).isEqualTo("new-hash");
        verify(userRepository).save(user);
    }

    @Test
    void confirmPinChange_mismatchedPins_throwsAndNeverVerifiesOtp() {
        assertThrows(PinMismatchException.class,
                () -> accountSecurityService.confirmPinChange(USER_ID, NEW_PIN, "0000", OTP_CODE));

        verify(otpService, never()).verifyOtp(anyString(), anyString(), any(OtpPurpose.class));
        verify(userRepository, never()).findById(any());
    }

    // ── missing user ─────────────────────────────────────────────────────

    @Test
    void requestPhoneChange_userNotFound_throwsResourceNotFound() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> accountSecurityService.requestPhoneChange(USER_ID, NEW_PHONE));
    }
}
