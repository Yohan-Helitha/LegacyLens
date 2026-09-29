package lk.ac.sliit.legacylens.stories.repository;

import lk.ac.sliit.legacylens.stories.entity.MediaType;
import lk.ac.sliit.legacylens.stories.entity.Story;
import lk.ac.sliit.legacylens.stories.entity.StoryMethod;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Round-trips Story through a real (H2) Hibernate session — confirms the
 * entity mapping (enums, nullable media fields, the author FK) actually
 * matches what StoryRepository's derived query expects, which a mocked
 * repository in StoryServiceImplTest can't verify.
 */
@DataJpaTest
class StoryRepositoryIntegrationTest {

    @Autowired
    private StoryRepository storyRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * save() followed directly by findById() can return the SAME managed
     * entity straight from the persistence-context identity map, without a
     * real DB round trip — which would let bugs in the mapping (e.g. a
     * column that never actually happens to reach the DB) hide behind
     * Hibernate's own in-memory bookkeeping. flush() + clear() forces a
     * genuine re-fetch.
     */
    @Autowired
    private TestEntityManager entityManager;

    private User persistAuthor(String phone) {
        User user = new User();
        user.setFullName("Kasun Perera");
        user.setPhoneNumber(phone);
        // NIC column is VARCHAR(20) — derive a short, unique-per-call value
        // rather than a phone-suffixed one, which can overflow it.
        user.setNicNumber("N" + UUID.randomUUID().toString().replace("-", "").substring(0, 15));
        user.setDateOfBirth(LocalDate.of(1998, 4, 12));
        user.setPinHash("irrelevant-hash");
        return userRepository.save(user);
    }

    @Test
    void savedStory_roundTripsAllFields() {
        User author = persistAuthor("+94770000001");

        Story story = new Story();
        story.setAuthor(author);
        story.setTitle("The Monsoon of '78");
        story.setDescription("A story about the great monsoon");
        story.setMethod(StoryMethod.RECORDED);
        story.setStatus(StoryStatus.PENDING);
        story.setMediaType(MediaType.AUDIO);
        story.setMediaFilePath("stories/abc.m4a");
        story.setMediaMimeType("audio/m4a");
        story.setMediaDurationMillis(45_000L);
        story.setMediaFileSizeBytes(123_456L);

        Story saved = storyRepository.save(story);
        entityManager.flush();
        entityManager.clear();

        Story reloaded = storyRepository.findById(saved.getId()).orElseThrow();
        assertThat(reloaded.getAuthor().getId()).isEqualTo(author.getId());
        assertThat(reloaded.getTitle()).isEqualTo("The Monsoon of '78");
        assertThat(reloaded.getStatus()).isEqualTo(StoryStatus.PENDING);
        assertThat(reloaded.getMethod()).isEqualTo(StoryMethod.RECORDED);
        assertThat(reloaded.getMediaType()).isEqualTo(MediaType.AUDIO);
        assertThat(reloaded.getMediaDurationMillis()).isEqualTo(45_000L);
        assertThat(reloaded.getCreatedAt()).isNotNull();
        assertThat(reloaded.getUpdatedAt()).isNotNull();
        assertThat(reloaded.getPublishedAt()).isNull();
    }

    @Test
    void writtenStory_hasNoMediaFields() {
        User author = persistAuthor("+94770000002");

        Story story = new Story();
        story.setAuthor(author);
        story.setTitle("A Written Memory");
        story.setMethod(StoryMethod.WRITTEN);

        Story saved = storyRepository.save(story);
        entityManager.flush();
        entityManager.clear();

        Story reloaded = storyRepository.findById(saved.getId()).orElseThrow();

        assertThat(reloaded.getMediaType()).isNull();
        assertThat(reloaded.getMediaFilePath()).isNull();
    }

    @Test
    void findByAuthorIdOrderByCreatedAtDesc_returnsOnlyThatAuthorsStories_newestFirst() throws InterruptedException {
        User author = persistAuthor("+94770000003");
        User otherAuthor = persistAuthor("+94770000004");

        Story first = new Story();
        first.setAuthor(author);
        first.setTitle("Recorded first");
        first.setMethod(StoryMethod.WRITTEN);
        storyRepository.save(first);

        // Ensure a strictly later createdAt timestamp for a deterministic order.
        Thread.sleep(5);

        Story second = new Story();
        second.setAuthor(author);
        second.setTitle("Recorded second");
        second.setMethod(StoryMethod.WRITTEN);
        storyRepository.save(second);

        Story someoneElses = new Story();
        someoneElses.setAuthor(otherAuthor);
        someoneElses.setTitle("Not this author's story");
        someoneElses.setMethod(StoryMethod.WRITTEN);
        storyRepository.save(someoneElses);

        entityManager.flush();
        entityManager.clear();

        List<Story> results = storyRepository.findByAuthorIdOrderByCreatedAtDesc(author.getId());

        assertThat(results).extracting(Story::getTitle)
                .containsExactly("Recorded second", "Recorded first");
    }

    @Test
    void authorIsRequired() {
        Story story = new Story();
        story.setTitle("Orphan story");
        story.setMethod(StoryMethod.WRITTEN);

        assertThrows(DataIntegrityViolationException.class, () -> storyRepository.saveAndFlush(story));
    }
}
