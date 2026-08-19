package lk.ac.sliit.legacylens.users.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.users.dto.UserProfileResponse;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.City;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.KnowledgeHolderProfile;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import lk.ac.sliit.legacylens.users.repository.KnowledgeHolderProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;

    @Mock
    private CreatorProfileRepository creatorProfileRepository;

    private UserProfileServiceImpl userProfileService;

    @BeforeEach
    void setUp() {
        userProfileService = new UserProfileServiceImpl(
                userRepository, knowledgeHolderProfileRepository, creatorProfileRepository);
    }

    @Test
    void getMyProfile_generalUserWithNoExtraProfiles_returnsBasicFields() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, RoleType.GENERAL_USER);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(knowledgeHolderProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(creatorProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

        UserProfileResponse response = userProfileService.getMyProfile(userId);

        assertThat(response.getUserId()).isEqualTo(userId);
        assertThat(response.getFullName()).isEqualTo("Kasun Perera");
        assertThat(response.getRoles()).containsExactly("GENERAL_USER");
        assertThat(response.getCity()).isNull();
        assertThat(response.getKnowledgeHolderProfile()).isNull();
        assertThat(response.getCreatorProfile()).isNull();
    }

    @Test
    void getMyProfile_elderWithKnowledgeHolderProfile_includesIt() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, RoleType.ELDER);

        City city = new City();
        city.setId(1);
        city.setName("Galle");
        city.setRegion("Southern Province");
        user.setCity(city);

        KnowledgeHolderProfile profile = new KnowledgeHolderProfile();
        profile.setPrimaryRegion("Southern Province");
        profile.setKnownTopics("Fishing vocabulary, folk songs");
        profile.setTrustScore(new BigDecimal("87.50"));
        profile.setBio("Retired fisherman, 40 years at sea");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(knowledgeHolderProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(creatorProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

        UserProfileResponse response = userProfileService.getMyProfile(userId);

        assertThat(response.getCity().getName()).isEqualTo("Galle");
        assertThat(response.getKnowledgeHolderProfile()).isNotNull();
        assertThat(response.getKnowledgeHolderProfile().getTrustScore()).isEqualTo(new BigDecimal("87.50"));
        assertThat(response.getCreatorProfile()).isNull();
    }

    @Test
    void getMyProfile_youthCreatorWithCreatorProfile_includesIt() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, RoleType.YOUTH_CREATOR);

        CreatorProfile profile = new CreatorProfile();
        profile.setSkills("Video Editing, Translation");
        profile.setInterests("Folklore, traditional music");
        profile.setVerificationStatus(VerificationStatus.VERIFIED);
        profile.setRating(new BigDecimal("4.80"));

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(knowledgeHolderProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(creatorProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));

        UserProfileResponse response = userProfileService.getMyProfile(userId);

        assertThat(response.getCreatorProfile()).isNotNull();
        assertThat(response.getCreatorProfile().getVerificationStatus()).isEqualTo("VERIFIED");
        assertThat(response.getKnowledgeHolderProfile()).isNull();
    }

    @Test
    void getMyProfile_unknownUserId_throwsResourceNotFoundException() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userProfileService.getMyProfile(userId));
    }

    private User buildUser(UUID userId, RoleType roleType) {
        User user = new User();
        user.setId(userId);
        user.setFullName("Kasun Perera");
        user.setPhoneNumber("+94771234567");
        user.setNicNumber("199812345678");
        user.setDateOfBirth(LocalDate.of(1998, 4, 12));
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setPhoneVerified(true);
        user.setRoles(new ArrayList<>());

        UserRole role = new UserRole();
        role.setUser(user);
        role.setRoleType(roleType);
        role.setStatus(RoleStatus.ACTIVE);
        user.getRoles().add(role);

        return user;
    }
}
