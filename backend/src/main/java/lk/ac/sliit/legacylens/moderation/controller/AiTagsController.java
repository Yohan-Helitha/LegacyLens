package lk.ac.sliit.legacylens.moderation.controller;

import lk.ac.sliit.legacylens.moderation.service.AiTagsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for AI-powered auto-tag generation.
 *
 * POST /api/v1/moderation/stories/{storyId}/ai-tags
 *   → { "tags": ["tag1", "tag2", ...] }
 */
@RestController
@RequiredArgsConstructor
public class AiTagsController {

    private final AiTagsService aiTagsService;

    @PostMapping("/api/v1/moderation/stories/{storyId}/ai-tags")
    public ResponseEntity<Map<String, List<String>>> generateAiTags(@PathVariable UUID storyId) {
        List<String> tags = aiTagsService.generateTagsForStory(storyId);
        return ResponseEntity.ok(Map.of("tags", tags));
    }
}

