package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.contentcapture.entity.StoryView;
import lk.ac.sliit.legacylens.contentcapture.repository.StoryViewRepository;
import lk.ac.sliit.legacylens.stories.entity.Story;
import lk.ac.sliit.legacylens.stories.repository.StoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class StoryViewTrackingServiceImpl implements StoryViewTrackingService {

    private static final int DEBOUNCE_WINDOW_HOURS = 24;

    private final StoryRepository storyRepository;
    private final StoryViewRepository storyViewRepository;

    public StoryViewTrackingServiceImpl(StoryRepository storyRepository, StoryViewRepository storyViewRepository) {
        this.storyRepository = storyRepository;
        this.storyViewRepository = storyViewRepository;
    }

    @Override
    @Transactional
    public void recordView(UUID storyId, UUID viewerId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("Story not found"));

        // Guard clause: an elder viewing their own story never counts as a view.
        if (story.getAuthor().getId().equals(viewerId)) {
            return;
        }

        LocalDateTime since = LocalDateTime.now().minusHours(DEBOUNCE_WINDOW_HOURS);
        if (storyViewRepository.existsRecentView(storyId, viewerId, since)) {
            return;
        }

        StoryView view = new StoryView();
        view.setStory(story);
        view.setViewerId(viewerId);
        storyViewRepository.save(view);

        // Atomic native UPDATE — avoids a lost update if two views for the
        // same story land concurrently (see StoryRepository.incrementViewCount).
        storyRepository.incrementViewCount(storyId);
    }
}
