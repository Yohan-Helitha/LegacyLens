package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationRequest;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.ExperienceLevel;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreatorApplicationServiceImplTest {

    @Mock private CreatorApplicationRepository creatorApplicationRepository;
    @Mock private UserRepository userRepository;
    @Mock private FileStorageService fileStorageService;

    private CreatorApplicationServiceImpl service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new CreatorApplicationServiceImpl(creatorApplicationRepository, userRepository, fileStorageService);

        user = new User();
        user.setId(UUID.randomUUID());
        user.setFullName("Arani Inothma");
        user.setPhoneNumber("0741344117");
        user.setNicNumber("199812345678");

        lenient().when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        lenient().when(creatorApplicationRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
        lenient().when(fileStorageService.store(any(), anyString(), anyList(), anyLong())).thenReturn("/uploads/creator-proofs/p.png");
        lenient().when(creatorApplicationRepository.save(any(CreatorApplication.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static CreatorApplicationRequest request(List<String> languages) {
        CreatorApplicationRequest request = new CreatorApplicationRequest();
        request.setEmail("arani@example.com");
        request.setAboutYou("I document local stories");
        request.setSkills(List.of("Photography"));
        request.setInterests(List.of("Traditional Foods"));
        request.setLanguages(languages);
        request.setExperienceLevel(ExperienceLevel.SOME_EXPERIENCE);
        request.setExperienceDescription("Cultural event photography");
        request.setProofDocument(new MockMultipartFile("proofDocument", "nic.png", "image/png", new byte[] {1}));
        return request;
    }

    @Test
    void submit_savesTheLanguagesWithTheirLevels_andReturnsThem() {
        CreatorApplicationResponse response = service.submitApplication(user.getId(),
                request(List.of("Sinhala:FLUENT", "English:BASIC")));

        ArgumentCaptor<CreatorApplication> saved = ArgumentCaptor.forClass(CreatorApplication.class);
        verify(creatorApplicationRepository).save(saved.capture());
        assertThat(saved.getValue().getLanguages()).isEqualTo("Sinhala:FLUENT,English:BASIC");
        assertThat(response.getLanguages()).extracting("language", "proficiency")
                .containsExactly(org.assertj.core.api.Assertions.tuple("Sinhala", "FLUENT"),
                        org.assertj.core.api.Assertions.tuple("English", "BASIC"));
    }

    @Test
    void submit_withALanguageButNoLevel_isRejectedAndNothingIsSaved() {
        assertThrows(InvalidRequestException.class,
                () -> service.submitApplication(user.getId(), request(List.of("Sinhala"))));

        verify(creatorApplicationRepository, never()).save(any());
    }

    @Test
    void submit_withAnUnsupportedLanguage_isRejected() {
        assertThrows(InvalidRequestException.class,
                () -> service.submitApplication(user.getId(), request(List.of("French:FLUENT"))));
    }

    // ── Changing languages later ────────────────────────────────────────────

    private CreatorApplication existingApplication(String languages) {
        CreatorApplication application = new CreatorApplication();
        application.setUser(user);
        application.setLanguages(languages);
        application.setExperienceLevel(ExperienceLevel.SOME_EXPERIENCE);
        application.setStatus(lk.ac.sliit.legacylens.users.entity.VerificationStatus.VERIFIED);
        when(creatorApplicationRepository.findByUserId(user.getId())).thenReturn(Optional.of(application));
        return application;
    }

    @Test
    void updateLanguages_replacesTheOldOnes_withoutSendingTheApplicationBackForReview() {
        CreatorApplication application = existingApplication(null);

        CreatorApplicationResponse response = service.updateMyLanguages(user.getId(),
                List.of("Sinhala:FLUENT", "Tamil:INTERMEDIATE"));

        assertThat(application.getLanguages()).isEqualTo("Sinhala:FLUENT,Tamil:INTERMEDIATE");
        assertThat(application.getStatus()).isEqualTo(lk.ac.sliit.legacylens.users.entity.VerificationStatus.VERIFIED);
        assertThat(response.getLanguages()).extracting("language", "proficiency")
                .containsExactly(org.assertj.core.api.Assertions.tuple("Sinhala", "FLUENT"),
                        org.assertj.core.api.Assertions.tuple("Tamil", "INTERMEDIATE"));
        verify(creatorApplicationRepository).save(application);
    }

    @Test
    void updateLanguages_withAnInvalidList_changesNothing() {
        CreatorApplication application = existingApplication("English:BASIC");

        assertThrows(InvalidRequestException.class, () -> service.updateMyLanguages(user.getId(), List.of("Sinhala")));
        assertThrows(InvalidRequestException.class, () -> service.updateMyLanguages(user.getId(), List.of()));

        assertThat(application.getLanguages()).isEqualTo("English:BASIC");
        verify(creatorApplicationRepository, never()).save(any());
    }

    @Test
    void updateLanguages_forSomeoneWhoNeverApplied_isNotFound() {
        assertThrows(lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException.class,
                () -> service.updateMyLanguages(user.getId(), List.of("Sinhala:FLUENT")));
    }
}
