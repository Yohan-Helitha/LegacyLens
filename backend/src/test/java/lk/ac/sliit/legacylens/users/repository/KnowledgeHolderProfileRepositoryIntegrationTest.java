package lk.ac.sliit.legacylens.users.repository;

import lk.ac.sliit.legacylens.users.entity.KnowledgeHolderProfile;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Round-trips the storyteller-intake fields added to KnowledgeHolderProfile
 * (preferredContentTypes, otherTopicNote, verificationStatus) through a real
 * H2 session, backing StorytellerServiceImplTest's mocked-repository coverage.
 */
@DataJpaTest
class KnowledgeHolderProfileRepositoryIntegrationTest {

    @Autowired
    private KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;

    @Autowired
    private UserRepository userRepository;

    private User persistUser() {
        User user = new User();
        user.setFullName("Anura Bandara");
        user.setPhoneNumber("+94770000099");
        user.setNicNumber("199912345678");
        user.setDateOfBirth(LocalDate.of(1999, 1, 1));
        user.setPinHash("irrelevant-hash");
        return userRepository.save(user);
    }

    @Test
    void defaultsToPendingVerification() {
        User user = persistUser();
        KnowledgeHolderProfile profile = new KnowledgeHolderProfile();
        profile.setUser(user);

        KnowledgeHolderProfile saved = knowledgeHolderProfileRepository.save(profile);
        KnowledgeHolderProfile reloaded = knowledgeHolderProfileRepository.findById(saved.getId()).orElseThrow();

        assertThat(reloaded.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
    }

    @Test
    void intakeAnswers_roundTripAndCanBeFlippedToVerified() {
        User user = persistUser();
        KnowledgeHolderProfile profile = new KnowledgeHolderProfile();
        profile.setUser(user);
        profile.setPreferredContentTypes("video,audio");
        profile.setKnownTopics("village-dialects,old-stories");
        profile.setOtherTopicNote("Also traditional cooking");

        KnowledgeHolderProfile saved = knowledgeHolderProfileRepository.save(profile);
        saved.setVerificationStatus(VerificationStatus.VERIFIED);
        knowledgeHolderProfileRepository.save(saved);

        KnowledgeHolderProfile reloaded = knowledgeHolderProfileRepository.findById(saved.getId()).orElseThrow();

        assertThat(reloaded.getPreferredContentTypes()).isEqualTo("video,audio");
        assertThat(reloaded.getKnownTopics()).isEqualTo("village-dialects,old-stories");
        assertThat(reloaded.getOtherTopicNote()).isEqualTo("Also traditional cooking");
        assertThat(reloaded.getVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
    }

    @Test
    void findByUserId_returnsTheProfileOwnedByThatUser() {
        User user = persistUser();
        KnowledgeHolderProfile profile = new KnowledgeHolderProfile();
        profile.setUser(user);
        knowledgeHolderProfileRepository.save(profile);

        assertThat(knowledgeHolderProfileRepository.findByUserId(user.getId())).isPresent();
    }
}
