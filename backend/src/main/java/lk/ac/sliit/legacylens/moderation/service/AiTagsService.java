package lk.ac.sliit.legacylens.moderation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Service that generates culturally relevant heritage tags from story content
 * using the Groq AI API (via GroqAiService).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiTagsService {

    private final GroqAiService groqAiService;
    private final ModerationQueueRepository moderationQueueRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate AI tags for a story by its UUID.
     * Loads the story from DB, sends content to Groq, returns parsed tag list.
     */
    public List<String> generateTagsForStory(UUID storyId) {
        ModerationQueueItem story = moderationQueueRepository.findById(storyId)
                .orElse(null);

        if (story == null) {
            log.warn("[AiTagsService] Story not found: {}", storyId);
            return Collections.emptyList();
        }

        String title       = story.getTitle();
        String description = story.getDescription();
        String bodyContent = story.getBodyContent();
        String type        = story.getType();

        // If the story has almost no content, return empty
        if (isBlank(title) && isBlank(description) && isBlank(bodyContent)) {
            log.warn("[AiTagsService] Story {} has no content to tag", storyId);
            return Collections.emptyList();
        }

        String rawJson = groqAiService.generateTags(title, description, bodyContent, type);

        if (rawJson == null || rawJson.isBlank()) {
            log.warn("[AiTagsService] Groq returned empty response for story {}", storyId);
            return Collections.emptyList();
        }

        return parseTags(rawJson);
    }

    /**
     * Parse Groq response — handles both bare JSON arrays and wrapped objects
     * like { "tags": [...] }
     */
    private List<String> parseTags(String rawJson) {
        try {
            String trimmed = rawJson.trim();

            // Direct array: ["tag1","tag2",...]
            if (trimmed.startsWith("[")) {
                String[] arr = objectMapper.readValue(trimmed, String[].class);
                return sanitize(Arrays.asList(arr));
            }

            // Wrapped object: { "tags": [...] } or similar
            var node = objectMapper.readTree(trimmed);

            // Try common field names
            for (String field : List.of("tags", "keywords", "labels", "taxonomy")) {
                if (node.has(field) && node.get(field).isArray()) {
                    String[] arr = objectMapper.convertValue(node.get(field), String[].class);
                    return sanitize(Arrays.asList(arr));
                }
            }

            // Fallback: first array field
            var fields = node.fields();
            while (fields.hasNext()) {
                var entry = fields.next();
                if (entry.getValue().isArray()) {
                    String[] arr = objectMapper.convertValue(entry.getValue(), String[].class);
                    return sanitize(Arrays.asList(arr));
                }
            }

            log.warn("[AiTagsService] Could not parse tags from JSON: {}", rawJson);
            return Collections.emptyList();

        } catch (Exception e) {
            log.error("[AiTagsService] Failed to parse tags JSON '{}': {}", rawJson, e.getMessage());
            return Collections.emptyList();
        }
    }

    /** Lowercase, trim, remove blanks, limit to 15 tags */
    private List<String> sanitize(List<String> raw) {
        return raw.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(s -> s.trim().toLowerCase().replaceAll("\\s+", "-"))
                .distinct()
                .limit(15)
                .toList();
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}

