package lk.ac.sliit.legacylens.contentcapture.repository;

import lk.ac.sliit.legacylens.stories.entity.Story;
import lk.ac.sliit.legacylens.stories.entity.StoryMethod;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.stories.repository.StoryRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Exercises StorySpecifications against a real Hibernate session — confirms
 * the composed Specification (owner + status + search) actually produces
 * the right SQL, which a mocked repository can't verify. Backs
 * StoryQueryService (Feature 4).
 */
@DataJpaTest
class StorySpecificationsIntegrationTest {

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

    private Story persistStory(User author, String title, StoryStatus status) {
        Story story = new Story();
        story.setAuthor(author);
        story.setTitle(title);
        story.setMethod(StoryMethod.WRITTEN);
        story.setStatus(status);
        return storyRepository.save(story);
    }

    @Test
    void getMyStories_noFilters_returnsAllOwnedByUser() {
        User owner = persistUser("+94770001001");
        persistStory(owner, "First Story", StoryStatus.PENDING);
        persistStory(owner, "Second Story", StoryStatus.PUBLISHED);
        entityManager.flush();
        entityManager.clear();

        Specification<Story> spec = Specification.where(StorySpecifications.ownedBy(owner.getId()));
        Page<Story> results = storyRepository.findAll(spec, PageRequest.of(0, 20));

        assertThat(results.getContent()).hasSize(2);
    }

    @Test
    void getMyStories_statusFilter_returnsOnlyMatching() {
        User owner = persistUser("+94770001002");
        persistStory(owner, "Draft Story", StoryStatus.DRAFT);
        persistStory(owner, "Published Story", StoryStatus.PUBLISHED);
        entityManager.flush();
        entityManager.clear();

        Specification<Story> spec = Specification
                .where(StorySpecifications.ownedBy(owner.getId()))
                .and(StorySpecifications.hasStatus(StoryStatus.PUBLISHED));
        Page<Story> results = storyRepository.findAll(spec, PageRequest.of(0, 20));

        assertThat(results.getContent()).extracting(Story::getTitle).containsExactly("Published Story");
    }

    @Test
    void getMyStories_searchTerm_matchesCaseInsensitive() {
        User owner = persistUser("+94770001003");
        persistStory(owner, "The Monsoon of '78", StoryStatus.PUBLISHED);
        persistStory(owner, "Fishing Tales", StoryStatus.PUBLISHED);
        entityManager.flush();
        entityManager.clear();

        Specification<Story> spec = Specification
                .where(StorySpecifications.ownedBy(owner.getId()))
                .and(StorySpecifications.titleContains("MONSOON"));
        Page<Story> results = storyRepository.findAll(spec, PageRequest.of(0, 20));

        assertThat(results.getContent()).extracting(Story::getTitle).containsExactly("The Monsoon of '78");
    }

    @Test
    void getMyStories_excludesOtherUsersContent() {
        User owner = persistUser("+94770001004");
        User other = persistUser("+94770001005");
        persistStory(owner, "Mine", StoryStatus.PUBLISHED);
        persistStory(other, "Not Mine", StoryStatus.PUBLISHED);
        entityManager.flush();
        entityManager.clear();

        Specification<Story> spec = Specification.where(StorySpecifications.ownedBy(owner.getId()));
        Page<Story> results = storyRepository.findAll(spec, PageRequest.of(0, 20));

        assertThat(results.getContent()).extracting(Story::getTitle).containsExactly("Mine");
    }

    @Test
    void getMyStories_pagination_respectsPageSize() {
        User owner = persistUser("+94770001006");
        for (int i = 0; i < 5; i++) {
            persistStory(owner, "Story " + i, StoryStatus.PUBLISHED);
        }
        entityManager.flush();
        entityManager.clear();

        Specification<Story> spec = Specification.where(StorySpecifications.ownedBy(owner.getId()));
        Pageable firstPage = PageRequest.of(0, 2);
        Page<Story> results = storyRepository.findAll(spec, firstPage);

        assertThat(results.getContent()).hasSize(2);
        assertThat(results.getTotalElements()).isEqualTo(5);
        assertThat(results.getTotalPages()).isEqualTo(3);
    }
}
