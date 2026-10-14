package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.marketplace.dto.AdminCreatorApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.ExperienceLevel;
import lk.ac.sliit.legacylens.marketplace.event.CreatorApplicationDecidedEvent;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/** What an admin's decision on a "Become a Content Creator" application changes - and what it must not. */
@ExtendWith(MockitoExtension.class)
class CreatorApplicationReviewServiceImplTest {

    @Mock private CreatorApplicationRepository applicationRepository;
    @Mock private UserRoleRepository userRoleRepository;
    @Mock private CreatorProfileRepository creatorProfileRepository;
    @Mock private ApplicationEventPublisher events;

    private CreatorApplicationReviewServiceImpl service;
    private User user;
    private CreatorApplication application;

    @BeforeEach
    void setUp() {
        service = new CreatorApplicationReviewServiceImpl(applicationRepository, userRoleRepository, creatorProfileRepository, events);

        user = new User();
        user.setId(UUID.randomUUID());

        application = new CreatorApplication();
        application.setId(UUID.randomUUID());
        application.setUser(user);
        application.setFullName("Savindu Perera");
        application.setSkills("Photography, Video Editing");
        application.setInterests("Folk Dance");
        application.setExperienceLevel(ExperienceLevel.values()[0]);
        application.setStatus(VerificationStatus.PENDING);
        application.setSubmittedAt(LocalDateTime.now());

        lenient().when(applicationRepository.findById(application.getId())).thenReturn(Optional.of(application));
        lenient().when(applicationRepository.save(any(CreatorApplication.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(userRoleRepository.findByUserId(user.getId())).thenReturn(List.of());
        lenient().when(creatorProfileRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
    }

    @Test
    void approveGrantsTheCreatorRoleAndAVerifiedProfileAndTellsTheApplicant() {
        AdminCreatorApplicationResponse response = service.approve(application.getId(), "  Welcome  ");

        assertThat(response.getStatus()).isEqualTo("VERIFIED");
        assertThat(response.getReviewNote()).isEqualTo("Welcome");

        ArgumentCaptor<UserRole> role = ArgumentCaptor.forClass(UserRole.class);
        verify(userRoleRepository).save(role.capture());
        assertThat(role.getValue().getRoleType()).isEqualTo(RoleType.YOUTH_CREATOR);
        assertThat(role.getValue().getStatus()).isEqualTo(RoleStatus.ACTIVE);

        ArgumentCaptor<CreatorProfile> profile = ArgumentCaptor.forClass(CreatorProfile.class);
        verify(creatorProfileRepository).save(profile.capture());
        assertThat(profile.getValue().getVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
        assertThat(profile.getValue().getSkills()).isEqualTo("Photography, Video Editing");

        verify(events).publishEvent(new CreatorApplicationDecidedEvent(user.getId(), true, "Welcome"));
    }

    @Test
    void approveSwitchesAnExistingInactiveCreatorRoleBackOnInsteadOfAddingASecond() {
        UserRole inactive = new UserRole();
        inactive.setUser(user);
        inactive.setRoleType(RoleType.YOUTH_CREATOR);
        inactive.setStatus(RoleStatus.INACTIVE);
        lenient().when(userRoleRepository.findByUserId(user.getId())).thenReturn(List.of(inactive));

        service.approve(application.getId(), null);

        assertThat(inactive.getStatus()).isEqualTo(RoleStatus.ACTIVE);
        verify(userRoleRepository).save(inactive);
    }

    @Test
    void rejectKeepsTheApplicantAGeneralUserAndStoresTheReasonTheyWillSee() {
        AdminCreatorApplicationResponse response = service.reject(application.getId(), "Proof document is unreadable");

        assertThat(response.getStatus()).isEqualTo("REJECTED");
        assertThat(response.getReviewNote()).isEqualTo("Proof document is unreadable");
        verify(userRoleRepository, never()).save(any(UserRole.class));
        verify(creatorProfileRepository, never()).save(any(CreatorProfile.class));
        verify(events).publishEvent(new CreatorApplicationDecidedEvent(user.getId(), false, "Proof document is unreadable"));
    }

    @Test
    void anApplicationAlreadyDecidedCannotBeDecidedAgain() {
        application.setStatus(VerificationStatus.VERIFIED);

        assertThatThrownBy(() -> service.reject(application.getId(), "x")).isInstanceOf(InvalidApplicationStateException.class);
        assertThatThrownBy(() -> service.approve(application.getId(), null)).isInstanceOf(InvalidApplicationStateException.class);
        verify(events, never()).publishEvent(any(Object.class));
    }

    @Test
    void listFiltersByStatusAndAnUnknownStatusIsRefused() {
        lenient().when(applicationRepository.findByStatus(VerificationStatus.PENDING)).thenReturn(List.of(application));

        assertThat(service.list("pending")).hasSize(1);
        assertThatThrownBy(() -> service.list("nonsense")).isInstanceOf(InvalidApplicationStateException.class);
    }
}
