package lk.ac.sliit.legacylens.auth.service;

import lk.ac.sliit.legacylens.auth.dto.AuthResponse;
import lk.ac.sliit.legacylens.auth.dto.ForgotPinRequest;
import lk.ac.sliit.legacylens.auth.dto.LoginRequest;
import lk.ac.sliit.legacylens.auth.dto.RegisterRequest;
import lk.ac.sliit.legacylens.auth.dto.RegisterResponse;
import lk.ac.sliit.legacylens.auth.dto.ResendOtpRequest;
import lk.ac.sliit.legacylens.auth.dto.ResetPinRequest;
import lk.ac.sliit.legacylens.auth.dto.VerifyOtpRequest;
import lk.ac.sliit.legacylens.auth.entity.OtpPurpose;
import lk.ac.sliit.legacylens.auth.security.JwtService;
import lk.ac.sliit.legacylens.common.exception.AccountLockedException;
import lk.ac.sliit.legacylens.common.exception.DuplicateNicException;
import lk.ac.sliit.legacylens.common.exception.DuplicatePhoneNumberException;
import lk.ac.sliit.legacylens.common.exception.InvalidCredentialsException;
import lk.ac.sliit.legacylens.common.exception.InvalidOtpException;
import lk.ac.sliit.legacylens.common.exception.PhoneNotVerifiedException;
import lk.ac.sliit.legacylens.common.exception.PinMismatchException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import lk.ac.sliit.legacylens.users.repository.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AuthServiceImpl. All collaborators (repositories, OtpService,
 * PasswordEncoder, JwtService) are Mockito mocks — no Spring context and no
 * real database is started, so these run fast and in isolation.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final String PHONE = "+94771234567";
    private static final String NIC = "199812345678";
    private static final String PIN = "1234";
    private static final int MAX_FAILED_PIN_ATTEMPTS = 5;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private OtpService otpService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                userRepository, userRoleRepository, otpService, passwordEncoder, jwtService,
                MAX_FAILED_PIN_ATTEMPTS);
    }

    // ── register ─────────────────────────────────────────────────────────

    @Test
    void register_newUser_savesUserAssignsRoleAndSendsOtp() {
        RegisterRequest request = buildRegisterRequest();

        when(userRepository.existsByPhoneNumber(PHONE)).thenReturn(false);
        when(userRepository.existsByNicNumber(NIC)).thenReturn(false);
        when(passwordEncoder.encode(PIN)).thenReturn("hashed-pin");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            if (user.getId() == null) {
                user.setId(UUID.randomUUID());
            }
            return user;
        });

        RegisterResponse response = authService.register(request);

        assertThat(response.getUserId()).isNotNull();
        assertThat(response.getPhoneNumber()).isEqualTo(PHONE);
        verify(userRoleRepository).save(any(UserRole.class));
        verify(otpService).issueOtp(PHONE, OtpPurpose.REGISTRATION);
    }

    @Test
    void register_duplicatePhoneNumber_throwsAndNeverSaves() {
        RegisterRequest request = buildRegisterRequest();
        when(userRepository.existsByPhoneNumber(PHONE)).thenReturn(true);

        assertThrows(DuplicatePhoneNumberException.class, () -> authService.register(request));

        verify(userRepository, never()).save(any());
        verify(otpService, never()).issueOtp(anyString(), any());
    }

    @Test
    void register_duplicateNic_throwsAndNeverSaves() {
        RegisterRequest request = buildRegisterRequest();
        when(userRepository.existsByPhoneNumber(PHONE)).thenReturn(false);
        when(userRepository.existsByNicNumber(NIC)).thenReturn(true);

        assertThrows(DuplicateNicException.class, () -> authService.register(request));

        verify(userRepository, never()).save(any());
    }

    // ── verifyOtpAndActivate ─────────────────────────────────────────────

    @Test
    void verifyOtpAndActivate_correctOtp_marksVerifiedAndReturnsToken() {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setPhoneNumber(PHONE);
        request.setOtpCode("123456");

        User user = buildActiveVerifiedUser();
        user.setPhoneVerified(false);

        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("mock-jwt");

        AuthResponse response = authService.verifyOtpAndActivate(request);

        assertThat(user.isPhoneVerified()).isTrue();
        assertThat(response.getToken()).isEqualTo("mock-jwt");
        verify(otpService).verifyOtp(PHONE, "123456", OtpPurpose.REGISTRATION);
        verify(userRepository).save(user);
    }

    @Test
    void verifyOtpAndActivate_userMissingAfterOtpCheck_throwsResourceNotFound() {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setPhoneNumber(PHONE);
        request.setOtpCode("123456");

        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.verifyOtpAndActivate(request));
    }

    @Test
    void verifyOtpAndActivate_invalidOtp_propagatesExceptionWithoutTouchingUser() {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setPhoneNumber(PHONE);
        request.setOtpCode("000000");

        org.mockito.Mockito.doThrow(new InvalidOtpException("Incorrect OTP code"))
                .when(otpService).verifyOtp(PHONE, "000000", OtpPurpose.REGISTRATION);

        assertThrows(InvalidOtpException.class, () -> authService.verifyOtpAndActivate(request));

        verify(userRepository, never()).findByPhoneNumber(anyString());
    }

    // ── resendOtp ────────────────────────────────────────────────────────

    @Test
    void resendOtp_unverifiedUser_issuesNewOtp() {
        ResendOtpRequest request = new ResendOtpRequest();
        request.setPhoneNumber(PHONE);

        User user = buildActiveVerifiedUser();
        user.setPhoneVerified(false);
        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.of(user));

        authService.resendOtp(request);

        verify(otpService).issueOtp(PHONE, OtpPurpose.REGISTRATION);
    }

    @Test
    void resendOtp_alreadyVerifiedUser_throwsInvalidOtpException() {
        ResendOtpRequest request = new ResendOtpRequest();
        request.setPhoneNumber(PHONE);

        User user = buildActiveVerifiedUser();
        user.setPhoneVerified(true);
        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.of(user));

        assertThrows(InvalidOtpException.class, () -> authService.resendOtp(request));

        verify(otpService, never()).issueOtp(anyString(), any());
    }

    // ── login ────────────────────────────────────────────────────────────

    @Test
    void login_correctPin_returnsTokenAndResetsFailedAttempts() {
        LoginRequest request = buildLoginRequest();
        User user = buildActiveVerifiedUser();
        user.setFailedPinAttempts(2);

        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(PIN, user.getPinHash())).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("mock-jwt");

        AuthResponse response = authService.login(request);

        assertThat(response.getToken()).isEqualTo("mock-jwt");
        assertThat(user.getFailedPinAttempts()).isEqualTo(0);
    }

    @Test
    void login_wrongPin_incrementsFailedAttemptsAndThrows() {
        LoginRequest request = buildLoginRequest();
        User user = buildActiveVerifiedUser();
        user.setFailedPinAttempts(1);

        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(PIN, user.getPinHash())).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUser.capture());
        assertThat(savedUser.getValue().getFailedPinAttempts()).isEqualTo(2);
    }

    @Test
    void login_tooManyFailedAttempts_throwsAccountLockedWithoutCheckingPin() {
        LoginRequest request = buildLoginRequest();
        User user = buildActiveVerifiedUser();
        user.setFailedPinAttempts(MAX_FAILED_PIN_ATTEMPTS);

        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.of(user));

        assertThrows(AccountLockedException.class, () -> authService.login(request));

        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void login_unverifiedPhone_throwsPhoneNotVerified() {
        LoginRequest request = buildLoginRequest();
        User user = buildActiveVerifiedUser();
        user.setPhoneVerified(false);

        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.of(user));

        assertThrows(PhoneNotVerifiedException.class, () -> authService.login(request));
    }

    @Test
    void login_suspendedAccount_throwsAccountLocked() {
        LoginRequest request = buildLoginRequest();
        User user = buildActiveVerifiedUser();
        user.setAccountStatus(AccountStatus.SUSPENDED);

        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.of(user));

        assertThrows(AccountLockedException.class, () -> authService.login(request));
    }

    @Test
    void login_unknownPhoneNumber_throwsInvalidCredentialsNotResourceNotFound() {
        LoginRequest request = buildLoginRequest();
        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.empty());

        // Deliberately the same exception as "wrong PIN" so login never reveals
        // whether a phone number is registered.
        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }

    // ── forgotPin / resetPin ─────────────────────────────────────────────

    @Test
    void forgotPin_existingUser_issuesPinResetOtp() {
        ForgotPinRequest request = new ForgotPinRequest();
        request.setPhoneNumber(PHONE);

        User user = buildActiveVerifiedUser();
        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.of(user));

        authService.forgotPin(request);

        verify(otpService).issueOtp(PHONE, OtpPurpose.PIN_RESET);
    }

    @Test
    void forgotPin_unknownPhoneNumber_doesNotThrowAndDoesNotIssueOtp() {
        ForgotPinRequest request = new ForgotPinRequest();
        request.setPhoneNumber(PHONE);

        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.empty());

        // Should complete silently — no exception — so callers can't probe
        // for which phone numbers are registered.
        authService.forgotPin(request);

        verify(otpService, never()).issueOtp(anyString(), any());
    }

    @Test
    void resetPin_validRequest_updatesHashAndReturnsToken() {
        ResetPinRequest request = new ResetPinRequest();
        request.setPhoneNumber(PHONE);
        request.setOtpCode("123456");
        request.setNewPin("5678");
        request.setConfirmNewPin("5678");

        User user = buildActiveVerifiedUser();
        user.setFailedPinAttempts(3);

        when(userRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("5678")).thenReturn("new-hashed-pin");
        when(jwtService.generateToken(user)).thenReturn("mock-jwt");

        AuthResponse response = authService.resetPin(request);

        assertThat(user.getPinHash()).isEqualTo("new-hashed-pin");
        assertThat(user.getFailedPinAttempts()).isEqualTo(0);
        assertThat(response.getToken()).isEqualTo("mock-jwt");
        verify(otpService).verifyOtp(PHONE, "123456", OtpPurpose.PIN_RESET);
    }

    @Test
    void resetPin_mismatchedConfirmation_throwsWithoutCheckingOtp() {
        ResetPinRequest request = new ResetPinRequest();
        request.setPhoneNumber(PHONE);
        request.setOtpCode("123456");
        request.setNewPin("5678");
        request.setConfirmNewPin("9999");

        assertThrows(PinMismatchException.class, () -> authService.resetPin(request));

        verify(otpService, never()).verifyOtp(anyString(), anyString(), any());
    }

    @Test
    void resetPin_invalidOtp_propagatesAndNeverSavesUser() {
        ResetPinRequest request = new ResetPinRequest();
        request.setPhoneNumber(PHONE);
        request.setOtpCode("000000");
        request.setNewPin("5678");
        request.setConfirmNewPin("5678");

        org.mockito.Mockito.doThrow(new InvalidOtpException("Incorrect OTP code"))
                .when(otpService).verifyOtp(PHONE, "000000", OtpPurpose.PIN_RESET);

        assertThrows(InvalidOtpException.class, () -> authService.resetPin(request));

        verify(userRepository, never()).save(any());
    }

    // ── shared test data builders ────────────────────────────────────────

    private RegisterRequest buildRegisterRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Kasun Perera");
        request.setPhoneNumber(PHONE);
        request.setDateOfBirth(LocalDate.of(1998, 4, 12));
        request.setNicNumber(NIC);
        request.setPin(PIN);

        return request;
    }

    private LoginRequest buildLoginRequest() {
        LoginRequest request = new LoginRequest();
        request.setPhoneNumber(PHONE);
        request.setPin(PIN);

        return request;
    }

    private User buildActiveVerifiedUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFullName("Kasun Perera");
        user.setPhoneNumber(PHONE);
        user.setNicNumber(NIC);
        user.setPinHash("hashed-pin");
        user.setDateOfBirth(LocalDate.of(1998, 4, 12));
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setPhoneVerified(true);
        user.setFailedPinAttempts(0);
        user.setRoles(new ArrayList<>());

        UserRole role = new UserRole();
        role.setUser(user);
        role.setRoleType(RoleType.GENERAL_USER);
        role.setStatus(RoleStatus.ACTIVE);
        user.getRoles().add(role);

        return user;
    }
}
