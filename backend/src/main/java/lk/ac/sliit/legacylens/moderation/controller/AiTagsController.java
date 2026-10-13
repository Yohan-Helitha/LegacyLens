package lk.ac.sliit.legacylens.moderation.controller;

import lk.ac.sliit.legacylens.moderation.service.AiTagsService;
import lk.ac.sliit.legacylens.tags.dto.AiTagItemDTO;
import lk.ac.sliit.legacylens.tags.dto.AiTagsResultDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for AI-powered auto-tag generation and canonical tag resolution.
 *
 * POST /api/v1/moderation/stories/{storyId}/ai-tags
 *   → { "tags": ["tag1", "tag2", ...], "items": [...], "relationships": [...] }
 */
@RestController
@RequiredArgsConstructor
public class AiTagsController {

    private final AiTagsService aiTagsService;

    @PostMapping("/api/v1/moderation/stories/{storyId}/ai-tags")
    public ResponseEntity<Map<String, Object>> generateAiTags(@PathVariable UUID storyId) {
        AiTagsResultDTO result = aiTagsService.generateAndResolveTagsForStory(storyId);
        List<String> tagNames = result.getTags().stream().map(AiTagItemDTO::getName).toList();

        Map<String, Object> resp = new HashMap<>();
        resp.put("tags", tagNames);
        resp.put("items", result.getTags());
        resp.put("relationships", result.getRelationships());

        return ResponseEntity.ok(resp);
    }
}
