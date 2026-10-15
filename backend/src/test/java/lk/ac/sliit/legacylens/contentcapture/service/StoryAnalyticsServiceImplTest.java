package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.common.exception.ForbiddenOperationException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.contentcapture.dto.AnalyticsSummaryDto;
import lk.ac.sliit.legacylens.contentcapture.dto.DailyViewsDto;
import lk.ac.sliit.legacylens.contentcapture.dto.RatingSummaryDto;
import lk.ac.sliit.legacylens.contentcapture.dto.StoryAnalyticsDto;
import lk.ac.sliit.legacylens.contentcapture.repository.StoryViewRepository;
import lk.ac.sliit.legacylens.home.entity.FeedItemComment;
import lk.ac.sliit.legacylens.home.repository.FeedItemCommentRepository;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.stories.entity.Story;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.stories.repository.StoryRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoryAnalyticsServiceImplTest {

    @Mock private StoryRepository storyRepository;
    @Mock private StoryViewRepository storyViewRepository;
    @Mock private ModerationQueueRepository moderationQueueRepository;
    @Mock private FeedItemCommentRepository commentRepository;
    @Mock private ReviewQueryService reviewQueryService;

    private StoryAnalyticsServiceImpl service;

    private UUID authorId;
    private Story story;

    @BeforeEach
    void setUp() {
        service = new StoryAnalyticsServiceImpl(
                storyRepository, storyViewRepository, moderationQueueRepository, commentRepository, reviewQueryService);

        authorId = UUID.randomUUID();
        User author = new User();
        author.setId(authorId);

        story = new Story();
        story.setId(UUID.randomUUID());
        story.setAuthor(author);
        story.setTitle("Avurudu rites");
        story.setStatus(StoryStatus.PUBLISHED);
        story.setViewCount(42);
    }

    private static List<LocalDateTime> viewsDaysAgo(int count, int daysAgo) {
        List<LocalDateTime> times = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            times.add(LocalDateTime.now().minusDays(daysAgo).minusMinutes(i));
        }
        return times;
    }

    @Test
    void trendIsUpWhenTheLastWeekBeatsThePreviousWeek() {
        List<LocalDateTime> views = new ArrayList<>(viewsDaysAgo(6, 2));
        views.addAll(viewsDaysAgo(3, 10));
        when(storyRepository.findByAuthorIdOrderByCreatedAtDesc(authorId)).thenReturn(List.of(story));
        when(storyViewRepository.findAuthorViewTimesSince(eq(authorId), eq(StoryStatus.PUBLISHED), any()))
                .thenReturn(views);
        when(moderationQueueRepository.findByAuthorIdAndStatus(authorId, StoryStatus.PUBLISHED))
                .thenReturn(Collections.emptyList());

        AnalyticsSummaryDto summary = service.getSummary(authorId);

        assertThat(summary.getViewsLast7Days()).isEqualTo(6);
        assertThat(summary.getViewsPrevious7Days()).isEqualTo(3);
        assertThat(summary.getTrendPercent()).isEqualTo(100);
        assertThat(summary.isTrending()).isTrue();
    }

    @Test
    void trendIsDownWhenViewsDropOrStayFlat() {
        List<LocalDateTime> views = new ArrayList<>(viewsDaysAgo(2, 1));
        views.addAll(viewsDaysAgo(5, 9));
        when(storyRepository.findByAuthorIdOrderByCreatedAtDesc(authorId)).thenReturn(List.of(story));
        when(storyViewRepository.findAuthorViewTimesSince(eq(authorId), eq(StoryStatus.PUBLISHED), any()))
                .thenReturn(views);
        when(moderationQueueRepository.findByAuthorIdAndStatus(authorId, StoryStatus.PUBLISHED))
                .thenReturn(Collections.emptyList());

        AnalyticsSummaryDto summary = service.getSummary(authorId);

        assertThat(summary.getTrendPercent()).isEqualTo(-60);
        assertThat(summary.isTrending()).isFalse();
    }

    @Test
    void noViewsAtAllIsNotTrending() {
        when(storyRepository.findByAuthorIdOrderByCreatedAtDesc(authorId)).thenReturn(Collections.emptyList());
        when(storyViewRepository.findAuthorViewTimesSince(eq(authorId), eq(StoryStatus.PUBLISHED), any()))
                .thenReturn(Collections.emptyList());
        when(moderationQueueRepository.findByAuthorIdAndStatus(authorId, StoryStatus.PUBLISHED))
                .thenReturn(Collections.emptyList());

        AnalyticsSummaryDto summary = service.getSummary(authorId);

        assertThat(summary.isTrending()).isFalse();
        assertThat(summary.getTrendPercent()).isZero();
        assertThat(summary.getPublishedStories()).isZero();
        assertThat(summary.getTopStoryTitle()).isNull();
    }

    @Test
    void summaryTotalsOnlyCountPublishedStoriesAndPicksTheTopOne() {
        Story pending = new Story();
        pending.setId(UUID.randomUUID());
        pending.setAuthor(story.getAuthor());
        pending.setTitle("Still a draft");
        pending.setStatus(StoryStatus.PENDING);
        pending.setViewCount(999);

        Story second = new Story();
        second.setId(UUID.randomUUID());
        second.setAuthor(story.getAuthor());
        second.setTitle("Kandyan drums");
        second.setStatus(StoryStatus.PUBLISHED);
        second.setViewCount(100);

        ModerationQueueItem rowA = new ModerationQueueItem();
        rowA.setLikesCount(10);
        rowA.setCommentsCount(2);
        ModerationQueueItem rowB = new ModerationQueueItem();
        rowB.setLikesCount(null);
        rowB.setCommentsCount(5);

        when(storyRepository.findByAuthorIdOrderByCreatedAtDesc(authorId)).thenReturn(List.of(story, pending, second));
        when(storyViewRepository.findAuthorViewTimesSince(eq(authorId), eq(StoryStatus.PUBLISHED), any()))
                .thenReturn(Collections.emptyList());
        when(moderationQueueRepository.findByAuthorIdAndStatus(authorId, StoryStatus.PUBLISHED))
                .thenReturn(List.of(rowA, rowB));

        AnalyticsSummaryDto summary = service.getSummary(authorId);

        assertThat(summary.getPublishedStories()).isEqualTo(2);
        assertThat(summary.getTotalViews()).isEqualTo(142);
        assertThat(summary.getTopStoryTitle()).isEqualTo("Kandyan drums");
        assertThat(summary.getTotalLikes()).isEqualTo(10);
        assertThat(summary.getTotalComments()).isEqualTo(7);
    }

    @Test
    void storyAnalyticsCombinesViewsLikesCommentsAndTheEldersRating() {
        ModerationQueueItem row = new ModerationQueueItem();
        row.setLikesCount(17);

        FeedItemComment comment = new FeedItemComment();
        comment.setAuthor("Nimali");
        comment.setText("Lovely memories");

        when(storyRepository.findById(story.getId())).thenReturn(Optional.of(story));
        when(storyViewRepository.findViewTimesSince(eq(story.getId()), any()))
                .thenReturn(viewsDaysAgo(4, 0));
        when(moderationQueueRepository.findById(story.getId())).thenReturn(Optional.of(row));
        when(commentRepository.findByStoryIdOrderByCreatedAtDesc(story.getId())).thenReturn(List.of(comment));
        when(reviewQueryService.getSummary(authorId))
                .thenReturn(RatingSummaryDto.builder().averageRating(new BigDecimal("4.5")).ratingCount(8).build());

        StoryAnalyticsDto dto = service.getStoryAnalytics(authorId, story.getId());

        assertThat(dto.getViewCount()).isEqualTo(42);
        assertThat(dto.getLikesCount()).isEqualTo(17);
        assertThat(dto.getCommentsCount()).isEqualTo(1);
        assertThat(dto.getReviews()).hasSize(1);
        assertThat(dto.getReviews().get(0).getReviewerName()).isEqualTo("Nimali");
        assertThat(dto.getAverageRating()).isEqualByComparingTo("4.5");
        assertThat(dto.getRatingCount()).isEqualTo(8);
        assertThat(dto.getViewsLast7Days()).isEqualTo(4);
        assertThat(dto.getDailyViews()).hasSize(7);
        assertThat(dto.getDailyViews().get(6).getViews()).isEqualTo(4);
    }

    @Test
    void anotherAuthorsStoryIsForbidden() {
        when(storyRepository.findById(story.getId())).thenReturn(Optional.of(story));

        assertThatThrownBy(() -> service.getStoryAnalytics(UUID.randomUUID(), story.getId()))
                .isInstanceOf(ForbiddenOperationException.class);
    }

    @Test
    void unknownStoryIsNotFound() {
        UUID missing = UUID.randomUUID();
        when(storyRepository.findById(missing)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getStoryAnalytics(authorId, missing))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void dailyBucketsAreOldestFirstEndTodayAndIncludeEmptyDays() {
        LocalDate today = LocalDate.of(2026, 10, 13);
        List<LocalDateTime> views = List.of(
                today.atTime(9, 0), today.atTime(10, 0), today.minusDays(2).atTime(8, 0));

        List<DailyViewsDto> days = StoryAnalyticsServiceImpl.dailyBuckets(views, today);

        assertThat(days).hasSize(7);
        assertThat(days.get(0).getDate()).isEqualTo(today.minusDays(6));
        assertThat(days.get(6).getDate()).isEqualTo(today);
        assertThat(days.get(6).getViews()).isEqualTo(2);
        assertThat(days.get(4).getViews()).isEqualTo(1);
        assertThat(days.get(5).getViews()).isZero();
    }
}
