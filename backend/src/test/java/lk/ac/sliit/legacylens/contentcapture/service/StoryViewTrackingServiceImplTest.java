package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.contentcapture.repository.StoryViewRepository;
import lk.ac.sliit.legacylens.stories.entity.Story;
import lk.ac.sliit.legacylens.stories.repository.StoryRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoryViewTrackingServiceImplTest {

    private static final UUID STORY_ID = UUID.randomUUID();
    private static final UUID AUTHOR_ID = UUID.randomUUID();
    private static final UUID VIEWER_ID = UUID.randomUUID();

    @Mock
    private StoryRepository storyRepository;

    @Mock
    private StoryViewRepository storyViewRepository;

    private StoryViewTrackingServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new StoryViewTrackingServiceImpl(storyRepository, storyViewRepository);
    }

    private Story buildStory(UUID authorId) {
        User author = new User();
        author.setId(authorId);

        Story story = new Story();
        story.setId(STORY_ID);
        story.setAuthor(author);
        return story;
    }

    @Test
    void recordView_ownerViewsOwnContent_doesNotIncrement() {
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.of(buildStory(AUTHOR_ID)));

        service.recordView(STORY_ID, AUTHOR_ID);

        verify(storyViewRepository, never()).save(any());
        verify(storyRepository, never()).incrementViewCount(any());
    }

    @Test
    void recordView_newViewerWithin24h_incrementsOnce() {
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.of(buildStory(AUTHOR_ID)));
        when(storyViewRepository.existsRecentView(any(), any(), any())).thenReturn(false);

        service.recordView(STORY_ID, VIEWER_ID);

        verify(storyViewRepository, times(1)).save(any());
        verify(storyRepository, times(1)).incrementViewCount(STORY_ID);
    }

    @Test
    void recordView_sameViewerTwiceWithin24h_incrementsOnlyOnce() {
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.of(buildStory(AUTHOR_ID)));
        // First call: no recent view yet. Second call: now there is one.
        when(storyViewRepository.existsRecentView(any(), any(), any())).thenReturn(false, true);

        service.recordView(STORY_ID, VIEWER_ID);
        service.recordView(STORY_ID, VIEWER_ID);

        verify(storyViewRepository, times(1)).save(any());
        verify(storyRepository, times(1)).incrementViewCount(STORY_ID);
    }

    @Test
    void recordView_sameViewerAfter24h_incrementsAgain() {
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.of(buildStory(AUTHOR_ID)));
        // Simulates the 24h window having passed: existsRecentView now returns false again.
        when(storyViewRepository.existsRecentView(any(), any(), any())).thenReturn(false, false);

        service.recordView(STORY_ID, VIEWER_ID);
        service.recordView(STORY_ID, VIEWER_ID);

        verify(storyViewRepository, times(2)).save(any());
        verify(storyRepository, times(2)).incrementViewCount(STORY_ID);
    }

    @Test
    void recordView_storyDoesNotExist_throwsResourceNotFound() {
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.recordView(STORY_ID, VIEWER_ID));

        verify(storyViewRepository, never()).save(any());
    }
}
