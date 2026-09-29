package lk.ac.sliit.legacylens.users.service;

import lk.ac.sliit.legacylens.auth.dto.AuthResponse;
import lk.ac.sliit.legacylens.auth.entity.OtpPurpose;
import lk.ac.sliit.legacylens.auth.security.JwtService;
import lk.ac.sliit.legacylens.auth.service.OtpService;
import lk.ac.sliit.legacylens.common.exception.ForbiddenOperationException;
import lk.ac.sliit.legacylens.common.exception.InvalidOtpException;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the "Become a Storyteller" upgrade flow. All collaborators
 * are Mockito mocks, mirroring AccountSecurityServiceImplTest's structure —
 * no Spring context, no real database.
 */
@ExtendWith(MockitoExtension.class)
class StorytellerServiceImplTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final String PHONE = "+94771234567";
    private static final String OTP_CODE = "123456";

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;

    @Mock
    private OtpService otpService;

    @Mock
    private JwtService jwtService;

    private StorytellerServiceImpl storytellerService;

    @BeforeEach
    void setUp() {
        storytellerService = new StorytellerServiceImpl(
                userRepository, userRoleRepository, knowledgeHolderProfileRepository, otpService, jwtService);
    }

    private User buildUser() {
        User user = new User();
        user.setId(USER_ID);
        user.setFullName("Kasun Perera");
        user.setPhoneNumber(PHONE);
        user.setNicNumber("199812345678");
        user.setDateOfBirth(LocalDate.of(1998, 4, 12));
        user.setRoles(new ArrayList<>());

        UserRole generalUser = new UserRole();
        generalUser.setUser(user);
        generalUser.setRoleType(RoleType.GENERAL_USER);
        generalUser.setStatus(RoleStatus.ACTIVE);
        user.getRoles().add(generalUser);

        return user;
    }

    private StorytellerPreferencesRequest buildPreferences() {
        StorytellerPreferencesRequest request = new StorytellerPreferencesRequest();
        request.setContentTypes(List.of("video", "audio"));
        request.setTopics(List.of("village-dialects", "old-stories"));
        request.setOtherTopic(null);
        return request;
    }

    // ── requestUpgrade ───────────────────────────────────────────────────

    @Test
    void requestUpgrade_newApplicant_savesPendingProfileAndIssuesOtp() {
        User user = buildUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRoleRepository.existsByUserIdAndRoleType(USER_ID, RoleType.ELDER)).thenReturn(false);
        when(knowledgeHolderProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());

        storytellerService.requestUpgrade(USER_ID, buildPreferences());

        ArgumentCaptor<KnowledgeHolderProfile> profileCaptor = ArgumentCaptor.forClass(KnowledgeHolderProfile.class);
        verify(knowledgeHolderProfileRepository).save(profileCaptor.capture());

        KnowledgeHolderProfile saved = profileCaptor.getValue();
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(saved.getPreferredContentTypes()).isEqualTo("video,audio");
        assertThat(saved.getKnownTopics()).isEqualTo("village-dialects,old-stories");
        assertThat(saved.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);

        verify(otpService).issueOtp(PHONE, OtpPurpose.ELDER_UPGRADE);
    }

    @Test
    void requestUpgrade_reappliesAfterAbandonedAttempt_overwritesExistingPendingProfile() {
        User user = buildUser();
        KnowledgeHolderProfile existing = new KnowledgeHolderProfile();
        existing.setUser(user);
        existing.setKnownTopics("old-stories");
        existing.setVerificationStatus(VerificationStatus.PENDING);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRoleRepository.existsByUserIdAndRoleType(USER_ID, RoleType.ELDER)).thenReturn(false);
        when(knowledgeHolderProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(existing));

        StorytellerPreferencesRequest updated = buildPreferences();
        updated.setTopics(List.of("farming-methods"));

        storytellerService.requestUpgrade(USER_ID, updated);

        assertThat(existing.getKnownTopics()).isEqualTo("farming-methods");
        verify(knowledgeHolderProfileRepository).save(existing);
    }

    @Test
    void requestUpgrade_alreadyElder_throwsForbiddenAndNeverIssuesOtp() {
        User user = buildUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRoleRepository.existsByUserIdAndRoleType(USER_ID, RoleType.ELDER)).thenReturn(true);

        assertThrows(ForbiddenOperationException.class,
                () -> storytellerService.requestUpgrade(USER_ID, buildPreferences()));

        verify(knowledgeHolderProfileRepository, never()).save(any());
        verify(otpService, never()).issueOtp(anyString(), any(OtpPurpose.class));
    }

    @Test
    void requestUpgrade_userNotFound_throwsResourceNotFound() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> storytellerService.requestUpgrade(USER_ID, buildPreferences()));
    }

    // ── confirmUpgrade ───────────────────────────────────────────────────

    @Test
    void confirmUpgrade_validOtp_verifiesProfileActivatesRoleAndReturnsFreshToken() {
        User user = buildUser();
        KnowledgeHolderProfile profile = new KnowledgeHolderProfile();
        profile.setUser(user);
        profile.setVerificationStatus(VerificationStatus.PENDING);

        when(userRepository.findByIdWithRoles(USER_ID)).thenReturn(Optional.of(user));
        when(knowledgeHolderProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(profile));
        when(jwtService.generateToken(user)).thenReturn("fresh-jwt");

        AuthResponse response = storytellerService.confirmUpgrade(USER_ID, OTP_CODE);

        verify(otpService).verifyOtp(PHONE, OTP_CODE, OtpPurpose.ELDER_UPGRADE);
        assertThat(profile.getVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);

        assertThat(user.getRoles()).anySatisfy(role -> {
            assertThat(role.getRoleType()).isEqualTo(RoleType.ELDER);
            assertThat(role.getStatus()).isEqualTo(RoleStatus.ACTIVE);
            assertThat(role.getActivatedAt()).isNotNull();
        });

        assertThat(response.getToken()).isEqualTo("fresh-jwt");
        assertThat(response.getRoles()).containsExactlyInAnyOrder("GENERAL_USER", "ELDER");
    }

    @Test
    void confirmUpgrade_previouslyInactiveElderRole_reactivatesInstead_ofDuplicating() {
        User user = buildUser();
        UserRole inactiveElder = new UserRole();
        inactiveElder.setUser(user);
        inactiveElder.setRoleType(RoleType.ELDER);
        inactiveElder.setStatus(RoleStatus.INACTIVE);
        user.getRoles().add(inactiveElder);

        KnowledgeHolderProfile profile = new KnowledgeHolderProfile();
        profile.setUser(user);

        when(userRepository.findByIdWithRoles(USER_ID)).thenReturn(Optional.of(user));
        when(knowledgeHolderProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(profile));
        when(jwtService.generateToken(user)).thenReturn("fresh-jwt");

        storytellerService.confirmUpgrade(USER_ID, OTP_CODE);

        assertThat(user.getRoles()).hasSize(2);
        assertThat(inactiveElder.getStatus()).isEqualTo(RoleStatus.ACTIVE);
        verify(userRoleRepository).save(inactiveElder);
    }

    @Test
    void confirmUpgrade_noPreferencesSubmittedYet_throwsResourceNotFoundAndNeverConsumesOtp() {
        User user = buildUser();
        when(userRepository.findByIdWithRoles(USER_ID)).thenReturn(Optional.of(user));
        when(knowledgeHolderProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> storytellerService.confirmUpgrade(USER_ID, OTP_CODE));

        verify(otpService, never()).verifyOtp(anyString(), anyString(), any(OtpPurpose.class));
    }

    @Test
    void confirmUpgrade_wrongOtp_propagatesAndNeverActivatesRole() {
        User user = buildUser();
        KnowledgeHolderProfile profile = new KnowledgeHolderProfile();
        profile.setUser(user);

        when(userRepository.findByIdWithRoles(USER_ID)).thenReturn(Optional.of(user));
        when(knowledgeHolderProfileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(profile));
        doThrow(new InvalidOtpException("Incorrect OTP code"))
                .when(otpService).verifyOtp(PHONE, OTP_CODE, OtpPurpose.ELDER_UPGRADE);

        assertThrows(InvalidOtpException.class, () -> storytellerService.confirmUpgrade(USER_ID, OTP_CODE));

        assertThat(user.getRoles()).noneMatch(role -> role.getRoleType() == RoleType.ELDER);
        verify(userRoleRepository, never()).save(any());
    }
}
