package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.contentcapture.dto.AnalyticsSummaryDto;
import lk.ac.sliit.legacylens.contentcapture.dto.StoryAnalyticsDto;

import java.util.UUID;

/** Read-only analytics for an elder's own published stories (views, likes, comments, trend). */
public interface StoryAnalyticsService {

    /** Dashboard card: totals across the author's published stories plus the 7-day view trend. */
    AnalyticsSummaryDto getSummary(UUID authorId);

    /**
     * One story's analytics. Throws ResourceNotFoundException if the story doesn't exist and
     * ForbiddenOperationException if it isn't the caller's own.
     */
    StoryAnalyticsDto getStoryAnalytics(UUID authorId, UUID storyId);
}
