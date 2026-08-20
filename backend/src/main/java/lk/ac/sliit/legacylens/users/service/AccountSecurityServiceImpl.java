package lk.ac.sliit.legacylens.users.service;

import lk.ac.sliit.legacylens.auth.entity.OtpPurpose;
import lk.ac.sliit.legacylens.auth.service.OtpService;
import lk.ac.sliit.legacylens.common.exception.DuplicateNicException;
import lk.ac.sliit.legacylens.common.exception.DuplicatePhoneNumberException;
import lk.ac.sliit.legacylens.common.exception.PinMismatchException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * See AccountSecurityService. Every method starts by loading the current
 * user by id (from the JWT principal, never the request body) so these
 * mutations always act on "myself," never an arbitrary account.
 */
@Service
public class AccountSecurityServiceImpl implements AccountSecurityService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;

    public AccountSecurityServiceImpl(
            UserRepository userRepository,
            OtpService otpService,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void requestPhoneChange(UUID userId, String newPhoneNumber) {
        User user = getUser(userId);

        assertPhoneAvailable(newPhoneNumber, user);

        // Sent to the NEW number — proves the user actually controls it.
        otpService.issueOtp(newPhoneNumber, OtpPurpose.PHONE_CHANGE);
    }

    @Override
    @Transactional
    public void confirmPhoneChange(UUID userId, String newPhoneNumber, String otpCode) {
        User user = getUser(userId);

        assertPhoneAvailable(newPhoneNumber, user);
        otpService.verifyOtp(newPhoneNumber, otpCode, OtpPurpose.PHONE_CHANGE);

        user.setPhoneNumber(newPhoneNumber);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void requestNicChange(UUID userId, String newNicNumber) {
        User user = getUser(userId);

        assertNicAvailable(newNicNumber, user);

        // Sent to the user's current, already-verified phone — proves it's
        // really the account owner asking, not just a valid session token.
        otpService.issueOtp(user.getPhoneNumber(), OtpPurpose.NIC_CHANGE);
    }

    @Override
    @Transactional
    public void confirmNicChange(UUID userId, String newNicNumber, String otpCode) {
        User user = getUser(userId);

        assertNicAvailable(newNicNumber, user);
        otpService.verifyOtp(user.getPhoneNumber(), otpCode, OtpPurpose.NIC_CHANGE);

        user.setNicNumber(newNicNumber);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void requestPinChange(UUID userId) {
        User user = getUser(userId);

        otpService.issueOtp(user.getPhoneNumber(), OtpPurpose.PIN_CHANGE);
    }

    @Override
    @Transactional
    public void confirmPinChange(UUID userId, String newPin, String confirmNewPin, String otpCode) {
        if (!newPin.equals(confirmNewPin)) {
            throw new PinMismatchException("New PIN and confirmation do not match");
        }

        User user = getUser(userId);

        otpService.verifyOtp(user.getPhoneNumber(), otpCode, OtpPurpose.PIN_CHANGE);

        user.setPinHash(passwordEncoder.encode(newPin));
        userRepository.save(user);
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void assertPhoneAvailable(String newPhoneNumber, User user) {
        if (newPhoneNumber.equals(user.getPhoneNumber())) {
            throw new DuplicatePhoneNumberException("That's already your current phone number");
        }
        if (userRepository.existsByPhoneNumber(newPhoneNumber)) {
            throw new DuplicatePhoneNumberException("This phone number is already registered");
        }
    }

    private void assertNicAvailable(String newNicNumber, User user) {
        if (newNicNumber.equals(user.getNicNumber())) {
            throw new DuplicateNicException("That's already your current NIC number");
        }
        if (userRepository.existsByNicNumber(newNicNumber)) {
            throw new DuplicateNicException("This NIC number is already registered");
        }
    }
}
