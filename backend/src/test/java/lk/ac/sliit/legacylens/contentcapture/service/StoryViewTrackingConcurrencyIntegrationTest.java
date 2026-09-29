package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.contentcapture.repository.StoryViewRepository;
import lk.ac.sliit.legacylens.stories.entity.Story;
import lk.ac.sliit.legacylens.stories.entity.StoryMethod;
import lk.ac.sliit.legacylens.stories.repository.StoryRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Fires concurrent recordView calls for the same story from distinct
 * viewers and asserts the final view count matches the number of unique
 * viewers exactly — a lost-update bug (read-modify-write instead of an
 * atomic UPDATE) would under-count here even though every individual
 * unit test above passes.
 *
 * Class-level NOT_SUPPORTED propagation (same reasoning as
 * CustomUserDetailsServiceIntegrationTest): @DataJpaTest's default single
 * rolled-back transaction would serialize every "concurrent" call onto one
 * connection, which can't reproduce a real race.
 */
@DataJpaTest
@Import(StoryViewTrackingServiceImpl.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class StoryViewTrackingConcurrencyIntegrationTest {

    @Autowired
    private StoryViewTrackingService storyViewTrackingService;

    @Autowired
    private StoryRepository storyRepository;

    @Autowired
    private StoryViewRepository storyViewRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void concurrentRecordView_uniqueViewers_finalCountMatchesUniqueViewerCount() throws InterruptedException {
        User author = new User();
        author.setFullName("Kasun Perera");
        author.setPhoneNumber("+94770003001");
        author.setNicNumber("N" + UUID.randomUUID().toString().replace("-", "").substring(0, 15));
        author.setDateOfBirth(LocalDate.of(1998, 4, 12));
        author.setPinHash("irrelevant-hash");
        userRepository.save(author);

        Story story = new Story();
        story.setAuthor(author);
        story.setTitle("A Popular Story");
        story.setMethod(StoryMethod.WRITTEN);
        storyRepository.save(story);
        UUID storyId = story.getId();

        int viewerCount = 20;
        List<UUID> viewerIds = new ArrayList<>();
        for (int i = 0; i < viewerCount; i++) {
            viewerIds.add(UUID.randomUUID());
        }

        ExecutorService executor = Executors.newFixedThreadPool(viewerCount);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneGate = new CountDownLatch(viewerCount);

        for (UUID viewerId : viewerIds) {
            executor.submit(() -> {
                try {
                    startGate.await();
                    storyViewTrackingService.recordView(storyId, viewerId);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    doneGate.countDown();
                }
            });
        }

        startGate.countDown();
        boolean completed = doneGate.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();

        Story reloaded = storyRepository.findById(storyId).orElseThrow();
        assertThat(reloaded.getViewCount()).isEqualTo(viewerCount);
        assertThat(storyViewRepository.count()).isEqualTo(viewerCount);
    }
}
