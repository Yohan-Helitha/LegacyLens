package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.common.exception.ForbiddenOperationException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.contentcapture.dto.AnalyticsSummaryDto;
import lk.ac.sliit.legacylens.contentcapture.dto.DailyViewsDto;
import lk.ac.sliit.legacylens.contentcapture.dto.RatingSummaryDto;
import lk.ac.sliit.legacylens.contentcapture.dto.StoryAnalyticsDto;
import lk.ac.sliit.legacylens.contentcapture.dto.StoryReviewDto;
import lk.ac.sliit.legacylens.contentcapture.repository.StoryViewRepository;
import lk.ac.sliit.legacylens.home.entity.FeedItemComment;
import lk.ac.sliit.legacylens.home.repository.FeedItemCommentRepository;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.stories.entity.Story;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.stories.repository.StoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class StoryAnalyticsServiceImpl implements StoryAnalyticsService {

    /** Length of one trend window — the last N days are compared with the N days before them. */
    static final int WINDOW_DAYS = 7;
    /** Newest comments shown as reviews on one story's analytics. */
    static final int MAX_REVIEWS = 20;

    private final StoryRepository storyRepository;
    private final StoryViewRepository storyViewRepository;
    private final ModerationQueueRepository moderationQueueRepository;
    private final FeedItemCommentRepository commentRepository;
    private final ReviewQueryService reviewQueryService;

    public StoryAnalyticsServiceImpl(
            StoryRepository storyRepository,
            StoryViewRepository storyViewRepository,
            ModerationQueueRepository moderationQueueRepository,
            FeedItemCommentRepository commentRepository,
            ReviewQueryService reviewQueryService) {
        this.storyRepository = storyRepository;
        this.storyViewRepository = storyViewRepository;
        this.moderationQueueRepository = moderationQueueRepository;
        this.commentRepository = commentRepository;
        this.reviewQueryService = reviewQueryService;
    }

    @Override
    @Transactional(readOnly = true)
    public AnalyticsSummaryDto getSummary(UUID authorId) {
        LocalDateTime now = LocalDateTime.now();
        List<LocalDateTime> viewTimes = storyViewRepository.findAuthorViewTimesSince(
                authorId, StoryStatus.PUBLISHED, now.minusDays(2L * WINDOW_DAYS));
        Trend trend = Trend.of(viewTimes, now);

        List<Story> published = storyRepository.findByAuthorIdOrderByCreatedAtDesc(authorId).stream()
                .filter(s -> s.getStatus() == StoryStatus.PUBLISHED)
                .toList();
        List<ModerationQueueItem> publishedRows =
                moderationQueueRepository.findByAuthorIdAndStatus(authorId, StoryStatus.PUBLISHED);

        long totalViews = published.stream().mapToLong(Story::getViewCount).sum();
        String topStory = published.stream()
                .filter(s -> s.getViewCount() > 0)
                .max(Comparator.comparingLong(Story::getViewCount))
                .map(Story::getTitle)
                .orElse(null);

        return AnalyticsSummaryDto.builder()
                .publishedStories(published.size())
                .totalViews(totalViews)
                .viewsLast7Days(trend.last)
                .viewsPrevious7Days(trend.previous)
                .trendPercent(trend.percent())
                .trending(trend.isTrending())
                .totalLikes(publishedRows.stream().mapToLong(r -> orZero(r.getLikesCount())).sum())
                .totalComments(publishedRows.stream().mapToLong(r -> orZero(r.getCommentsCount())).sum())
                .topStoryTitle(topStory)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public StoryAnalyticsDto getStoryAnalytics(UUID authorId, UUID storyId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new ForbiddenOperationException("You can only view analytics for your own stories");
        }

        LocalDateTime now = LocalDateTime.now();
        List<LocalDateTime> viewTimes = storyViewRepository.findViewTimesSince(
                storyId, now.minusDays(2L * WINDOW_DAYS));
        Trend trend = Trend.of(viewTimes, now);

        ModerationQueueItem row = moderationQueueRepository.findById(storyId).orElse(null);
        long likes = row != null ? orZero(row.getLikesCount()) : 0;

        List<FeedItemComment> comments = commentRepository.findByStoryIdOrderByCreatedAtDesc(storyId);
        List<StoryReviewDto> reviews = comments.stream()
                .limit(MAX_REVIEWS)
                .map(c -> StoryReviewDto.builder()
                        .reviewerName(c.getAuthor())
                        .reviewerAvatarUrl(c.getAuthorAvatar())
                        .text(c.getText())
                        .createdAt(c.getCreatedAt())
                        .build())
                .toList();

        RatingSummaryDto rating = reviewQueryService.getSummary(authorId);

        return StoryAnalyticsDto.builder()
                .storyId(storyId)
                .title(story.getTitle())
                .status(story.getStatus().name())
                .publishedAt(story.getPublishedAt())
                .viewCount(story.getViewCount())
                .likesCount(likes)
                .commentsCount(comments.size())
                .viewsLast7Days(trend.last)
                .viewsPrevious7Days(trend.previous)
                .trendPercent(trend.percent())
                .trending(trend.isTrending())
                .dailyViews(dailyBuckets(viewTimes, now.toLocalDate()))
                .reviews(reviews)
                .averageRating(rating.getAverageRating())
                .ratingCount(rating.getRatingCount())
                .build();
    }

    /** Exactly {@code WINDOW_DAYS} entries, oldest first, ending on {@code today}; empty days are 0. */
    static List<DailyViewsDto> dailyBuckets(List<LocalDateTime> viewTimes, LocalDate today) {
        List<DailyViewsDto> days = new ArrayList<>();
        for (int i = WINDOW_DAYS - 1; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            long count = viewTimes.stream().filter(t -> t.toLocalDate().equals(day)).count();
            days.add(new DailyViewsDto(day, count));
        }
        return days;
    }

    private static long orZero(Integer value) {
        return value != null ? value : 0;
    }

    /** Views in the last {@code WINDOW_DAYS} days vs the {@code WINDOW_DAYS} before that. */
    static final class Trend {
        final long last;
        final long previous;

        private Trend(long last, long previous) {
            this.last = last;
            this.previous = previous;
        }

        static Trend of(List<LocalDateTime> viewTimes, LocalDateTime now) {
            LocalDateTime lastStart = now.minusDays(WINDOW_DAYS);
            LocalDateTime previousStart = now.minusDays(2L * WINDOW_DAYS);
            long last = viewTimes.stream().filter(t -> t.isAfter(lastStart)).count();
            long previous = viewTimes.stream().filter(t -> t.isAfter(previousStart) && !t.isAfter(lastStart)).count();
            return new Trend(last, previous);
        }

        /** Trending means strictly more views than the previous window (including any views against none). */
        boolean isTrending() {
            return last > previous;
        }

        int percent() {
            if (previous == 0) {
                return last > 0 ? 100 : 0;
            }
            return (int) Math.round((last - previous) * 100.0 / previous);
        }
    }
}
