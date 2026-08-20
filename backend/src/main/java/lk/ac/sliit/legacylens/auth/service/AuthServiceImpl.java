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
import lk.ac.sliit.legacylens.users.entity.City;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import lk.ac.sliit.legacylens.users.repository.CityRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import lk.ac.sliit.legacylens.users.repository.UserRoleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Orchestrates registration, OTP-gated activation, and login.
 * Delegates OTP mechanics to OtpService and token creation to JwtService —
 * this class only coordinates them (Single Responsibility).
 */
@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final CityRepository cityRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final int maxFailedPinAttempts;

    public AuthServiceImpl(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            CityRepository cityRepository,
            OtpService otpService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.auth.max-failed-pin-attempts:5}") int maxFailedPinAttempts) {

        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.cityRepository = cityRepository;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.maxFailedPinAttempts = maxFailedPinAttempts;
    }

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new DuplicatePhoneNumberException("An account with this phone number already exists");
        }

        if (userRepository.existsByNicNumber(request.getNicNumber())) {
            throw new DuplicateNicException("An account with this NIC number already exists");
        }

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new ResourceNotFoundException("Selected city was not found"));

        User user = new User();
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setNicNumber(request.getNicNumber());
        user.setCity(city);
        user.setPinHash(passwordEncoder.encode(request.getPin()));
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setPhoneVerified(false);
        userRepository.save(user);

        assignDefaultRole(user);
        otpService.issueOtp(user.getPhoneNumber(), OtpPurpose.REGISTRATION);

        return RegisterResponse.builder()
                .userId(user.getId())
                .phoneNumber(user.getPhoneNumber())
                .message("Registered successfully. An OTP has been sent to your phone number.")
                .build();
    }

    @Override
    @Transactional
    public AuthResponse verifyOtpAndActivate(VerifyOtpRequest request) {
        otpService.verifyOtp(request.getPhoneNumber(), request.getOtpCode(), OtpPurpose.REGISTRATION);

        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPhoneVerified(true);
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Override
    public void resendOtp(ResendOtpRequest request) {
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.isPhoneVerified()) {
            throw new InvalidOtpException("This phone number is already verified");
        }

        otpService.issueOtp(user.getPhoneNumber(), OtpPurpose.REGISTRATION);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid phone number or PIN"));

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AccountLockedException("This account is " + user.getAccountStatus().name().toLowerCase());
        }

        if (!user.isPhoneVerified()) {
            throw new PhoneNotVerifiedException("Please verify your phone number before logging in");
        }

        if (user.getFailedPinAttempts() >= maxFailedPinAttempts) {
            throw new AccountLockedException("Too many failed attempts. Please reset your PIN.");
        }

        boolean pinMatches = passwordEncoder.matches(request.getPin(), user.getPinHash());

        if (!pinMatches) {
            user.setFailedPinAttempts(user.getFailedPinAttempts() + 1);
            userRepository.save(user);

            throw new InvalidCredentialsException("Invalid phone number or PIN");
        }

        user.setFailedPinAttempts(0);
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Override
    public void forgotPin(ForgotPinRequest request) {
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .filter(u -> u.getNicNumber().equals(request.getNicNumber()))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "We couldn't find an account matching that phone number and NIC"));

        otpService.issueOtp(user.getPhoneNumber(), OtpPurpose.PIN_RESET);
    }

    @Override
    public void verifyResetOtp(VerifyOtpRequest request) {
        otpService.checkOtp(request.getPhoneNumber(), request.getOtpCode(), OtpPurpose.PIN_RESET);
    }

    @Override
    @Transactional
    public AuthResponse resetPin(ResetPinRequest request) {
        if (!request.getNewPin().equals(request.getConfirmNewPin())) {
            throw new PinMismatchException("New PIN and confirmation do not match");
        }

        otpService.verifyOtp(request.getPhoneNumber(), request.getOtpCode(), OtpPurpose.PIN_RESET);

        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPinHash(passwordEncoder.encode(request.getNewPin()));
        user.setFailedPinAttempts(0);
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    private void assignDefaultRole(User user) {
        UserRole role = new UserRole();
        role.setUser(user);
        role.setRoleType(RoleType.GENERAL_USER);
        role.setStatus(RoleStatus.ACTIVE);
        role.setActivatedAt(LocalDateTime.now());
        userRoleRepository.save(role);

        user.getRoles().add(role);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user);

        List<String> roleNames = user.getRoles().stream()
                .map(UserRole::getRoleType)
                .map(RoleType::name)
                .collect(Collectors.toList());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .roles(roleNames)
                .build();
    }
}
