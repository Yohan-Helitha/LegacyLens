package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorProfileResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.ExperienceLevel;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.users.entity.City;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreatorProfileViewServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private CreatorProfileRepository creatorProfileRepository;
    @Mock private CreatorApplicationRepository creatorApplicationRepository;
    @Mock private JobRepository jobRepository;
    @Mock private OpportunityApplicationRepository opportunityApplicationRepository;

    private CreatorProfileViewServiceImpl service;

    private User creator;
    private CreatorProfile profile;
    private CreatorApplication application;

    @BeforeEach
    void setUp() {
        service = new CreatorProfileViewServiceImpl(userRepository, creatorProfileRepository, creatorApplicationRepository,
                jobRepository, opportunityApplicationRepository, new CreatorProfileResponseMapper());

        City colombo = new City();
        colombo.setName("Colombo");
        creator = new User();
        creator.setId(UUID.randomUUID());
        creator.setFullName("Arani Inothma");
        creator.setPhoneNumber("0741344117");
        creator.setNicNumber("199812345678");
        creator.setCity(colombo);

        profile = new CreatorProfile();
        profile.setUser(creator);
        profile.setVerificationStatus(VerificationStatus.VERIFIED);
        profile.setRating(new BigDecimal("4.8"));

        application = new CreatorApplication();
        application.setUser(creator);
        application.setEmail("arani@example.com");
        application.setAboutYou("I document local stories in Sinhala and English.");
        application.setSkills("Photography, Content writing");
        application.setInterests("Traditional Dance");
        application.setExperienceLevel(ExperienceLevel.SOME_EXPERIENCE);
        application.setExperienceDescription("Cultural event photography");
        application.setProofDocumentUrl("/uploads/creator-proofs/nic.png");
        application.setStatus(VerificationStatus.VERIFIED);

        lenient().when(userRepository.findById(creator.getId())).thenReturn(Optional.of(creator));
        lenient().when(creatorProfileRepository.findByUserId(creator.getId())).thenReturn(Optional.of(profile));
        lenient().when(creatorApplicationRepository.findByUserId(creator.getId())).thenReturn(Optional.of(application));
        lenient().when(jobRepository.countByCreatorIdAndStatus(creator.getId(), JobStatus.COMPLETED)).thenReturn(3L);
        lenient().when(jobRepository.countDistinctEldersByCreatorIdAndStatus(creator.getId(), JobStatus.COMPLETED)).thenReturn(2L);
        lenient().when(jobRepository.countByCreatorIdAndStatusIn(eq(creator.getId()), any())).thenReturn(6L);
        lenient().when(opportunityApplicationRepository.countByCreatorIdAndStatusIn(eq(creator.getId()), any())).thenReturn(18L);

        Job done = new Job();
        done.setId(UUID.randomUUID());
        done.setTitle("Traditional recipe documentation");
        done.setCompletedAt(LocalDateTime.of(2026, 8, 1, 10, 0));
        lenient().when(jobRepository.findByCreatorIdAndStatus(eq(creator.getId()), eq(JobStatus.COMPLETED), any()))
                .thenReturn(List.of(done));
    }

    @Test
    void theOwner_seesTheirFullNicContactDetailsAndDocumentStatus() {
        CreatorProfileResponse view = service.getProfile(creator.getId(), creator.getId());

        assertThat(view.getOwnerDetails()).isNotNull();
        assertThat(view.getOwnerDetails().getNicNumber()).isEqualTo("199812345678");
        assertThat(view.getOwnerDetails().getEmail()).isEqualTo("arani@example.com");
        assertThat(view.getOwnerDetails().getPhoneNumber()).isEqualTo("0741344117");
        assertThat(view.getOwnerDetails().isProofUploaded()).isTrue();
        assertThat(view.getOwnerDetails().getProofContentType()).isEqualTo("image/png");
    }

    @Test
    void anyoneElse_getsNoNicNoContactDetailsAndNoDocument() {
        CreatorProfileResponse view = service.getProfile(UUID.randomUUID(), creator.getId());

        assertThat(view.getOwnerDetails()).isNull();
        assertThat(view.toString()).doesNotContain("199812345678").doesNotContain("0741344117")
                .doesNotContain("arani@example.com").doesNotContain("creator-proofs");
    }

    @Test
    void theSharedPartOfTheProfile_isBuiltFromRealData() {
        CreatorProfileResponse view = service.getProfile(UUID.randomUUID(), creator.getId());

        assertThat(view.getName()).isEqualTo("Arani Inothma");
        assertThat(view.getCity()).isEqualTo("Colombo");
        assertThat(view.getRating()).isEqualByComparingTo("4.8");
        assertThat(view.getContributionsCount()).isEqualTo(2);
        assertThat(view.getAboutYou()).startsWith("I document local stories");
        assertThat(view.getSkills()).containsExactly("Photography", "Content writing");
        assertThat(view.getInterests()).containsExactly("Traditional Dance");
        assertThat(view.getLanguages()).containsExactlyInAnyOrder("Sinhala", "English");
        assertThat(view.getExperienceLevel()).isEqualTo("SOME_EXPERIENCE");
        assertThat(view.getCompletedCount()).isEqualTo(3);
        assertThat(view.getApprovedCount()).isEqualTo(18);
        assertThat(view.getActiveCount()).isEqualTo(6);
        assertThat(view.getPreviousContributions()).extracting("title").containsExactly("Traditional recipe documentation");
    }

    @Test
    void anUnverifiedCreator_isNotFoundToEveryoneButThemselves() {
        profile.setVerificationStatus(VerificationStatus.PENDING);

        assertThrows(ResourceNotFoundException.class, () -> service.getProfile(UUID.randomUUID(), creator.getId()));
        assertThat(service.getProfile(creator.getId(), creator.getId()).getOwnerDetails()).isNotNull();
    }

    @Test
    void someoneWhoAppliedButHasNoProfileYet_canStillSeeTheirOwnPage() {
        when(creatorProfileRepository.findByUserId(creator.getId())).thenReturn(Optional.empty());

        CreatorProfileResponse view = service.getProfile(creator.getId(), creator.getId());

        assertThat(view.getOwnerDetails().getApplicationStatus()).isEqualTo("VERIFIED");
        assertThat(view.getRating()).isNull();
    }

    @Test
    void anUnknownUser_isNotFound() {
        UUID stranger = UUID.randomUUID();
        when(userRepository.findById(stranger)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getProfile(creator.getId(), stranger));
    }
}
