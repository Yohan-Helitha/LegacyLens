package lk.ac.sliit.legacylens.contentcapture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Everything the story analytics screen shows for one of the elder's own stories. */
@Data
@Builder
@AllArgsConstructor
public class StoryAnalyticsDto {

    private UUID storyId;
    private String title;
    private String status;
    private LocalDateTime publishedAt;

    private long viewCount;
    private long likesCount;
    private long commentsCount;

    private long viewsLast7Days;
    private long viewsPrevious7Days;
    private int trendPercent;
    private boolean trending;
    /** Oldest first, always 7 entries ending today — days with no views are present with 0. */
    private List<DailyViewsDto> dailyViews;

    /** Newest first, capped — the story's comments. */
    private List<StoryReviewDto> reviews;

    /**
     * The elder's overall rating (from ElderRating, given by creators they've worked with) — stories
     * themselves aren't rated, so this is the same on every one of the elder's stories. Null when unrated.
     */
    private BigDecimal averageRating;
    private int ratingCount;
}
