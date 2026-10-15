package lk.ac.sliit.legacylens.contentcapture.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.common.dto.PagedResponse;
import lk.ac.sliit.legacylens.contentcapture.dto.AnalyticsSummaryDto;
import lk.ac.sliit.legacylens.contentcapture.dto.StoryAnalyticsDto;
import lk.ac.sliit.legacylens.contentcapture.dto.StorySummaryDto;
import lk.ac.sliit.legacylens.contentcapture.service.StoryAnalyticsService;
import lk.ac.sliit.legacylens.contentcapture.service.StoryQueryService;
import lk.ac.sliit.legacylens.contentcapture.service.StoryViewTrackingService;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Read/interaction endpoints for stories — search/filter/paginate "My
 * Stories" and view-count recording. Kept separate from StoryController
 * (create/update/delete), which owns the CRUD surface.
 */
@RestController
@RequestMapping("/api/stories")
public class ContentController {

    private final StoryQueryService storyQueryService;
    private final StoryViewTrackingService storyViewTrackingService;
    private final StoryAnalyticsService storyAnalyticsService;

    public ContentController(
            StoryQueryService storyQueryService,
            StoryViewTrackingService storyViewTrackingService,
            StoryAnalyticsService storyAnalyticsService) {
        this.storyQueryService = storyQueryService;
        this.storyViewTrackingService = storyViewTrackingService;
        this.storyAnalyticsService = storyAnalyticsService;
    }

    /** Dashboard analytics card — totals and the 7-day view trend across the caller's published stories. */
    @GetMapping("/mine/analytics/summary")
    public ResponseEntity<ApiResponse<AnalyticsSummaryDto>> getAnalyticsSummary(
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.ok(storyAnalyticsService.getSummary(principal.getUser().getId())));
    }

    /** One of the caller's own stories: views, likes, comments (as reviews), 7-day chart and trend. */
    @GetMapping("/{storyId}/analytics")
    public ResponseEntity<ApiResponse<StoryAnalyticsDto>> getStoryAnalytics(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID storyId) {

        return ResponseEntity.ok(ApiResponse.ok(
                storyAnalyticsService.getStoryAnalytics(principal.getUser().getId(), storyId)));
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<PagedResponse<StorySummaryDto>>> getMine(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) StoryStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PagedResponse<StorySummaryDto> result =
                storyQueryService.getMyStories(principal.getUser().getId(), status, search, pageable);

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{storyId}/view")
    public ResponseEntity<ApiResponse<Void>> recordView(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID storyId) {

        storyViewTrackingService.recordView(storyId, principal.getUser().getId());

        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
