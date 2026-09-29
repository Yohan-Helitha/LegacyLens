package lk.ac.sliit.legacylens.contentcapture.service;

import java.util.UUID;

/**
 * Records a story view and (debounced) increments its view count. Kept
 * entirely separate from StoryQueryService — recording a view and reading
 * story data are different responsibilities with different callers and
 * different reasons to change (Single Responsibility).
 */
public interface StoryViewTrackingService {

    /**
     * No-ops if the viewer is the story's own author, or if this viewer
     * already has a recorded view for this story within the last 24 hours.
     */
    void recordView(UUID storyId, UUID viewerId);
}
