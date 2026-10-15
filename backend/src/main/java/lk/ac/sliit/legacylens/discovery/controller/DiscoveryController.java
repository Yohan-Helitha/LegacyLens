package lk.ac.sliit.legacylens.discovery.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.discovery.dto.DiscoveryStoryResponse;
import lk.ac.sliit.legacylens.discovery.service.CulturalDiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/discovery")
public class DiscoveryController {

    private final CulturalDiscoveryService discoveryService;

    public DiscoveryController(CulturalDiscoveryService discoveryService) {
        this.discoveryService = discoveryService;
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<DiscoveryStoryResponse>>> searchStories(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "false") boolean includeRelated,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<DiscoveryStoryResponse> results = discoveryService.searchPublishedStories(
                query, tags, category, district, region, type, includeRelated, page, size);

        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @GetMapping("/stories/{storyId}/related")
    public ResponseEntity<ApiResponse<List<DiscoveryStoryResponse>>> getRelatedStories(
            @PathVariable UUID storyId,
            @RequestParam(defaultValue = "4") int limit) {

        List<DiscoveryStoryResponse> related = discoveryService.getRelatedStories(storyId, limit);
        return ResponseEntity.ok(ApiResponse.ok(related));
    }

    @GetMapping("/recommendations/home")
    public ResponseEntity<ApiResponse<List<DiscoveryStoryResponse>>> getHomeRecommendations(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) UUID viewerId,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "10") int limit) {

        UUID effectiveViewerId = null;
        if (principal != null && principal.getUser() != null) {
            effectiveViewerId = principal.getUser().getId();
        } else if (viewerId != null) {
            effectiveViewerId = viewerId;
        }

        List<DiscoveryStoryResponse> recommendations = discoveryService.getPersonalizedRecommendations(
                effectiveViewerId, type, limit);

        return ResponseEntity.ok(ApiResponse.ok(recommendations));
    }
}

