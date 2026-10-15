package lk.ac.sliit.legacylens.moderation.integration;

import lk.ac.sliit.legacylens.marketplace.service.PublishedWork;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoryFeedWorkPublisherTest {

    @Mock private ModerationQueueRepository repository;

    private PublishedWork work(String type, String title, String image) {
        return new PublishedWork(UUID.randomUUID(), UUID.randomUUID(), title, "Summary", "Body text",
                List.of("clay", "craft"), type,
                "VIDEO".equals(type) ? "https://x.test/making.mp4" : null,
                "VIDEO".equals(type) ? "video/mp4" : null, image);
    }

    private ModerationQueueItem publish(PublishedWork work) {
        StoryFeedWorkPublisher publisher = new StoryFeedWorkPublisher(repository);
        when(repository.save(any(ModerationQueueItem.class))).thenAnswer(call -> {
            ModerationQueueItem item = call.getArgument(0);
            item.setId(UUID.randomUUID());
            return item;
        });
        UUID id = publisher.publish(work);
        ArgumentCaptor<ModerationQueueItem> saved = ArgumentCaptor.forClass(ModerationQueueItem.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getId()).isEqualTo(id);
        return saved.getValue();
    }

    @Test
    void creatorWorkIsSavedAsAnAlreadyPublishedPostAuthoredByTheCreator() {
        PublishedWork work = work("VIDEO", "Making of Clay Lamps", "https://x.test/cover.jpg");

        ModerationQueueItem item = publish(work);

        assertThat(item.getStatus()).isEqualTo(StoryStatus.PUBLISHED);
        assertThat(item.getPublishedAt()).isNotNull();
        assertThat(item.getAuthorId()).isEqualTo(work.creatorId());
        assertThat(item.getType()).isEqualTo("VIDEO");
        assertThat(item.getMethod()).isEqualTo("UPLOADED");
        assertThat(item.getMediaFilePath()).isEqualTo("https://x.test/making.mp4");
        assertThat(item.getImageUrl()).isEqualTo("https://x.test/cover.jpg");
        assertThat(item.getBodyContent()).isEqualTo("Body text");
        assertThat(item.getTags()).containsExactly("clay", "craft");
    }

    @Test
    void writtenWorkIsAWrittenStoryWithNoMedia() {
        ModerationQueueItem item = publish(work("BLOG", "A story", null));

        assertThat(item.getType()).isEqualTo("BLOG");
        assertThat(item.getMethod()).isEqualTo("WRITTEN");
        assertThat(item.getMediaFilePath()).isNull();
    }

    @Test
    void aTitleOrLinkLongerThanItsColumnDoesNotFailThePublish() {
        ModerationQueueItem item = publish(work("BLOG", "T".repeat(300), "https://x.test/" + "a".repeat(600)));

        assertThat(item.getTitle()).hasSize(200);
        assertThat(item.getImageUrl()).isNull();
    }
}
