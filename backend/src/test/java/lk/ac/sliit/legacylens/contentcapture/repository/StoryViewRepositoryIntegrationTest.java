package lk.ac.sliit.legacylens.contentcapture.repository;

import lk.ac.sliit.legacylens.contentcapture.entity.StoryView;
import lk.ac.sliit.legacylens.stories.entity.Story;
import lk.ac.sliit.legacylens.stories.entity.StoryMethod;
import lk.ac.sliit.legacylens.stories.repository.StoryRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class StoryViewRepositoryIntegrationTest {

    @Autowired
    private StoryViewRepository storyViewRepository;

    @Autowired
    private StoryRepository storyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User persistUser(String phone) {
        User user = new User();
        user.setFullName("Kasun Perera");
        user.setPhoneNumber(phone);
        user.setNicNumber("N" + UUID.randomUUID().toString().replace("-", "").substring(0, 15));
        user.setDateOfBirth(LocalDate.of(1998, 4, 12));
        user.setPinHash("irrelevant-hash");
        return userRepository.save(user);
    }

    private Story persistStory(User author) {
        Story story = new Story();
        story.setAuthor(author);
        story.setTitle("A Story");
        story.setMethod(StoryMethod.WRITTEN);
        return storyRepository.save(story);
    }

    private StoryView persistView(Story story, UUID viewerId, LocalDateTime viewedAt) {
        StoryView view = new StoryView();
        view.setStory(story);
        view.setViewerId(viewerId);
        StoryView saved = storyViewRepository.save(view);
        // viewedAt is @CreationTimestamp — overwrite it directly for a deterministic "N hours ago" fixture.
        entityManager.getEntityManager()
                .createQuery("UPDATE StoryView v SET v.viewedAt = :viewedAt WHERE v.id = :id")
                .setParameter("viewedAt", viewedAt)
                .setParameter("id", saved.getId())
                .executeUpdate();
        return saved;
    }

    @Test
    void existsRecentView_findsWithin24Hours() {
        User author = persistUser("+94770002001");
        Story story = persistStory(author);
        UUID viewerId = UUID.randomUUID();
        persistView(story, viewerId, LocalDateTime.now().minusHours(1));
        entityManager.flush();
        entityManager.clear();

        boolean exists = storyViewRepository.existsRecentView(story.getId(), viewerId, LocalDateTime.now().minusHours(24));

        assertThat(exists).isTrue();
    }

    @Test
    void existsRecentView_excludesOlderThan24Hours() {
        User author = persistUser("+94770002002");
        Story story = persistStory(author);
        UUID viewerId = UUID.randomUUID();
        persistView(story, viewerId, LocalDateTime.now().minusHours(30));
        entityManager.flush();
        entityManager.clear();

        boolean exists = storyViewRepository.existsRecentView(story.getId(), viewerId, LocalDateTime.now().minusHours(24));

        assertThat(exists).isFalse();
    }

    @Test
    void existsRecentView_differentViewer_returnsFalse() {
        User author = persistUser("+94770002003");
        Story story = persistStory(author);
        persistView(story, UUID.randomUUID(), LocalDateTime.now().minusHours(1));
        entityManager.flush();
        entityManager.clear();

        boolean exists = storyViewRepository.existsRecentView(story.getId(), UUID.randomUUID(), LocalDateTime.now().minusHours(24));

        assertThat(exists).isFalse();
    }
}
