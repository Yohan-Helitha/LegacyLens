package lk.ac.sliit.legacylens.users.service;

import lk.ac.sliit.legacylens.auth.dto.AuthResponse;
import lk.ac.sliit.legacylens.auth.entity.OtpPurpose;
import lk.ac.sliit.legacylens.auth.security.JwtService;
import lk.ac.sliit.legacylens.auth.service.OtpService;
import lk.ac.sliit.legacylens.common.exception.ForbiddenOperationException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.users.dto.StorytellerPreferencesRequest;
import lk.ac.sliit.legacylens.users.entity.KnowledgeHolderProfile;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.KnowledgeHolderProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import lk.ac.sliit.legacylens.users.repository.UserRoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StorytellerServiceImpl implements StorytellerService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;
    private final OtpService otpService;
    private final JwtService jwtService;

    public StorytellerServiceImpl(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            KnowledgeHolderProfileRepository knowledgeHolderProfileRepository,
            OtpService otpService,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.knowledgeHolderProfileRepository = knowledgeHolderProfileRepository;
        this.otpService = otpService;
        this.jwtService = jwtService;
    }

    @Override
    @Transactional
    public void requestUpgrade(UUID userId, StorytellerPreferencesRequest preferences) {
        User user = getUser(userId);

        if (userRoleRepository.existsByUserIdAndRoleType(userId, RoleType.ELDER)) {
            throw new ForbiddenOperationException("You're already a storyteller");
        }

        KnowledgeHolderProfile profile = knowledgeHolderProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    KnowledgeHolderProfile fresh = new KnowledgeHolderProfile();
                    fresh.setUser(user);
                    return fresh;
                });

        profile.setPreferredContentTypes(String.join(",", preferences.getContentTypes()));
        profile.setKnownTopics(String.join(",", preferences.getTopics()));
        profile.setOtherTopicNote(preferences.getOtherTopic());
        profile.setVerificationStatus(VerificationStatus.PENDING);
        knowledgeHolderProfileRepository.save(profile);

        // Sent to the user's current, already-verified phone — proves it's
        // really the account owner asking, same reasoning as NIC/PIN changes.
        otpService.issueOtp(user.getPhoneNumber(), OtpPurpose.ELDER_UPGRADE);
    }

    @Override
    @Transactional
    public AuthResponse confirmUpgrade(UUID userId, String otpCode) {
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        KnowledgeHolderProfile profile = knowledgeHolderProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Answer the storyteller questions before verifying"));

        otpService.verifyOtp(user.getPhoneNumber(), otpCode, OtpPurpose.ELDER_UPGRADE);

        profile.setVerificationStatus(VerificationStatus.VERIFIED);
        knowledgeHolderProfileRepository.save(profile);

        activateElderRole(user);

        return buildAuthResponse(user);
    }

    private void activateElderRole(User user) {
        UserRole elderRole = user.getRoles().stream()
                .filter(role -> role.getRoleType() == RoleType.ELDER)
                .findFirst()
                .orElseGet(() -> {
                    UserRole fresh = new UserRole();
                    fresh.setUser(user);
                    fresh.setRoleType(RoleType.ELDER);
                    user.getRoles().add(fresh);
                    return fresh;
                });

        elderRole.setStatus(RoleStatus.ACTIVE);
        elderRole.setActivatedAt(LocalDateTime.now());
        userRoleRepository.save(elderRole);
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user);

        List<String> roleNames = user.getRoles().stream()
                .filter(role -> role.getStatus() == RoleStatus.ACTIVE)
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
