package lk.ac.sliit.legacylens.admin.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.home.dto.FeaturedKeeperRequest;
import lk.ac.sliit.legacylens.home.dto.FeaturedKeeperResponse;
import lk.ac.sliit.legacylens.home.service.KnowledgeKeeperService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/knowledge-keepers")
@RequiredArgsConstructor
public class AdminKnowledgeKeeperController {

    private final KnowledgeKeeperService service;

    /**
     * GET /api/admin/knowledge-keepers - list all knowledge keepers
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FeaturedKeeperResponse>>> getAllKeepers() {
        return ResponseEntity.ok(ApiResponse.ok("Knowledge keepers retrieved successfully", service.getAllKeepers()));
    }

    /**
     * GET /api/admin/knowledge-keepers/published-stories - list published stories available for generation
     */
    @GetMapping("/published-stories")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPublishedStories() {
        return ResponseEntity.ok(ApiResponse.ok("Published stories retrieved successfully", service.getPublishedStoriesForAdmin()));
    }

    /**
     * POST /api/admin/knowledge-keepers/generate?storyId=...&activeDate=... - AI generation with Groq
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<FeaturedKeeperResponse>> generateFromStory(
            @RequestParam UUID storyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate activeDate) {
        FeaturedKeeperResponse response = service.generateFromStoryId(storyId, activeDate);
        return ResponseEntity.ok(ApiResponse.ok("Knowledge keeper successfully generated with Groq AI", response));
    }

    /**
     * POST /api/admin/knowledge-keepers - manual create
     */
    @PostMapping
    public ResponseEntity<ApiResponse<FeaturedKeeperResponse>> createKeeper(@Valid @RequestBody FeaturedKeeperRequest request) {
        FeaturedKeeperResponse response = service.createKeeper(request);
        return ResponseEntity.ok(ApiResponse.ok("Knowledge keeper created successfully", response));
    }

    /**
     * PUT /api/admin/knowledge-keepers/{id} - manual update
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FeaturedKeeperResponse>> updateKeeper(
            @PathVariable Long id,
            @Valid @RequestBody FeaturedKeeperRequest request) {
        FeaturedKeeperResponse response = service.updateKeeper(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Knowledge keeper updated successfully", response));
    }

    /**
     * DELETE /api/admin/knowledge-keepers/{id} - delete
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteKeeper(@PathVariable Long id) {
        service.deleteKeeper(id);
        return ResponseEntity.ok(ApiResponse.ok("Knowledge keeper deleted successfully", null));
    }

    /**
     * POST /api/admin/knowledge-keepers/{id}/activate-today - set keeper active for today
     */
    @PostMapping("/{id}/activate-today")
    public ResponseEntity<ApiResponse<FeaturedKeeperResponse>> activateToday(@PathVariable Long id) {
        FeaturedKeeperResponse response = service.setActiveForToday(id);
        return ResponseEntity.ok(ApiResponse.ok("Knowledge keeper set as active for today", response));
    }
}
