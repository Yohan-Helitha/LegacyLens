package lk.ac.sliit.legacylens.moderation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.tags.dto.AiTagItemDTO;
import lk.ac.sliit.legacylens.tags.dto.AiTagRelationshipDTO;
import lk.ac.sliit.legacylens.tags.dto.AiTagsResultDTO;
import lk.ac.sliit.legacylens.tags.entity.RelationshipType;
import lk.ac.sliit.legacylens.tags.entity.Tag;
import lk.ac.sliit.legacylens.tags.entity.TagAssignmentSource;
import lk.ac.sliit.legacylens.tags.repository.StoryTagRepository;
import lk.ac.sliit.legacylens.tags.service.TagNormalizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service that generates culturally relevant heritage tags from story content
 * using the Groq AI API and normalizes them into the canonical tag system.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiTagsService {

    private final GroqAiService groqAiService;
    private final ModerationQueueRepository moderationQueueRepository;
    private final TagNormalizationService tagNormalizationService;
    private final StoryTagRepository storyTagRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate AI tags for a story by its UUID (legacy string array compatible).
     */
    @Transactional
    public List<String> generateTagsForStory(UUID storyId) {
        AiTagsResultDTO result = generateAndResolveTagsForStory(storyId);
        return result.getTags().stream()
                .map(AiTagItemDTO::getName)
                .toList();
    }

    /**
     * Full AI-driven generation and canonical tag resolution workflow:
     * 1. Loads story from DB
     * 2. Prompts Groq for structured tags and candidate relationships
     * 3. Resolves suggested concepts against canonical tags & aliases
     * 4. Idempotently assigns tags with assignment_source = 'AI'
     * 5. Preserves existing manual ADMIN assignments
     * 6. Updates legacy stories.tags column with canonical names
     * 7. Records valid relationships in tag_relationships
     */
    @Transactional
    public AiTagsResultDTO generateAndResolveTagsForStory(UUID storyId) {
        ModerationQueueItem story = moderationQueueRepository.findById(storyId).orElse(null);

        if (story == null) {
            log.warn("[AiTagsService] Story not found: {}", storyId);
            return AiTagsResultDTO.builder().build();
        }

        String title       = story.getTitle();
        String description = story.getDescription();
        String bodyContent = story.getBodyContent();
        String type        = story.getType();

        if (isBlank(title) && isBlank(description) && isBlank(bodyContent)) {
            log.warn("[AiTagsService] Story {} has no content to tag", storyId);
            return AiTagsResultDTO.builder().build();
        }

        // Try structured generation first
        String rawJson = groqAiService.generateStructuredTags(title, description, bodyContent, type);

        // Fallback to legacy string generator if structured returned null
        if (rawJson == null || rawJson.isBlank()) {
            rawJson = groqAiService.generateTags(title, description, bodyContent, type);
        }

        if (rawJson == null || rawJson.isBlank()) {
            log.warn("[AiTagsService] Groq returned empty response for story {}", storyId);
            return fallbackKeywords(story);
        }

        AiTagsResultDTO parsed = parseStructuredTags(rawJson);

        // If parsed empty, attempt legacy parse fallback
        if (parsed.getTags().isEmpty()) {
            List<String> legacyTags = parseLegacyTags(rawJson);
            for (String lt : legacyTags) {
                parsed.getTags().add(AiTagItemDTO.builder()
                        .name(lt)
                        .language("en")
                        .category("heritage")
                        .confidence(0.85)
                        .build());
            }
        }

        // Resolve each suggested tag into canonical taxonomy
        List<AiTagItemDTO> resolvedTags = new ArrayList<>();
        Map<String, Tag> nameToTagMap = new HashMap<>();

        for (AiTagItemDTO item : parsed.getTags()) {
            if (item.getName() == null || item.getName().isBlank()) {
                continue;
            }
            try {
                String cleanName = item.getName().trim().replaceAll("^[#]+", "");
                String lang = item.getLanguage() != null ? item.getLanguage() : "en";
                String cat = item.getCategory() != null ? item.getCategory() : "heritage";
                String desc = item.getDescription();
                Double conf = item.getConfidence() != null ? item.getConfidence() : 0.85;

                Optional<Tag> existing = tagNormalizationService.resolveCanonicalTag(cleanName);
                boolean isNew = existing.isEmpty();

                Tag canonicalTag = tagNormalizationService.findOrCreateCanonicalTag(
                        cleanName, lang, cat, desc, true);

                tagNormalizationService.assignTagToStory(
                        storyId, canonicalTag.getId(), conf, TagAssignmentSource.AI);

                item.setTagId(canonicalTag.getId());
                item.setName(canonicalTag.getCanonicalName());
                item.setCategory(canonicalTag.getCategory());
                item.setNew(isNew);
                resolvedTags.add(item);

                nameToTagMap.put(canonicalTag.getNormalizedName(), canonicalTag);
                nameToTagMap.put(tagNormalizationService.normalizeTagName(cleanName), canonicalTag);
            } catch (Exception e) {
                log.warn("[AiTagsService] Error resolving tag '{}' for story {}: {}", item.getName(), storyId, e.getMessage());
            }
        }

        // Resolve and create candidate relationships
        List<AiTagRelationshipDTO> createdRelationships = new ArrayList<>();
        for (AiTagRelationshipDTO rel : parsed.getRelationships()) {
            if (rel.getSource() == null || rel.getTarget() == null) continue;
            try {
                String normSource = tagNormalizationService.normalizeTagName(rel.getSource());
                String normTarget = tagNormalizationService.normalizeTagName(rel.getTarget());

                Tag sourceTag = nameToTagMap.get(normSource);
                if (sourceTag == null) {
                    sourceTag = tagNormalizationService.resolveCanonicalTag(rel.getSource()).orElse(null);
                }

                Tag targetTag = nameToTagMap.get(normTarget);
                if (targetTag == null) {
                    targetTag = tagNormalizationService.resolveCanonicalTag(rel.getTarget()).orElse(null);
                }

                if (sourceTag != null && targetTag != null && !sourceTag.getId().equals(targetTag.getId())) {
                    RelationshipType relType = RelationshipType.RELATED_TO;
                    try {
                        if (rel.getType() != null) {
                            relType = RelationshipType.valueOf(rel.getType().trim().toUpperCase());
                        }
                    } catch (Exception ignored) {}

                    tagNormalizationService.addTagRelationship(sourceTag.getId(), targetTag.getId(), relType, 0.90);
                    createdRelationships.add(rel);
                }
            } catch (Exception e) {
                log.debug("[AiTagsService] Relationship creation notice: {}", e.getMessage());
            }
        }

        // Backward compatibility: Update story.tags column on ModerationQueueItem
        try {
            List<Tag> allStoryTags = storyTagRepository.findTagsByStoryId(storyId);
            String[] tagArray = allStoryTags.stream().map(Tag::getCanonicalName).toArray(String[]::new);
            story.setTags(tagArray);
            moderationQueueRepository.save(story);
        } catch (Exception e) {
            log.warn("[AiTagsService] Error syncing story.tags array: {}", e.getMessage());
        }

        return AiTagsResultDTO.builder()
                .tags(resolvedTags)
                .relationships(createdRelationships)
                .build();
    }

    /**
     * Parses the Groq response into structured tags and relationships.
     */
    public AiTagsResultDTO parseStructuredTags(String rawJson) {
        List<AiTagItemDTO> tags = new ArrayList<>();
        List<AiTagRelationshipDTO> relationships = new ArrayList<>();

        try {
            String trimmed = rawJson.trim();
            JsonNode root = objectMapper.readTree(trimmed);

            // Tags array
            JsonNode tagsNode = root.path("tags");
            if (tagsNode.isArray()) {
                for (JsonNode tNode : tagsNode) {
                    if (tNode.isObject()) {
                        String name = tNode.path("name").asText(null);
                        if (name == null || name.isBlank()) {
                            name = tNode.path("tag").asText(null);
                        }
                        if (name != null && !name.isBlank()) {
                            tags.add(AiTagItemDTO.builder()
                                    .name(name.trim())
                                    .language(tNode.path("language").asText("en"))
                                    .description(tNode.path("description").asText(null))
                                    .category(tNode.path("category").asText("heritage"))
                                    .confidence(tNode.path("confidence").asDouble(0.90))
                                    .build());
                        }
                    } else if (tNode.isTextual()) {
                        String text = tNode.asText().trim();
                        if (!text.isBlank()) {
                            tags.add(AiTagItemDTO.builder()
                                    .name(text)
                                    .language("en")
                                    .category("heritage")
                                    .confidence(0.85)
                                    .build());
                        }
                    }
                }
            }

            // Relationships array
            JsonNode relsNode = root.path("relationships");
            if (relsNode.isArray()) {
                for (JsonNode rNode : relsNode) {
                    String src = rNode.path("source").asText(null);
                    String tgt = rNode.path("target").asText(null);
                    String typ = rNode.path("type").asText("RELATED_TO");
                    if (src != null && tgt != null && !src.isBlank() && !tgt.isBlank()) {
                        relationships.add(AiTagRelationshipDTO.builder()
                                .source(src.trim())
                                .target(tgt.trim())
                                .type(typ.trim())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("[AiTagsService] Failed to parse structured tags JSON: {}", e.getMessage());
        }

        return AiTagsResultDTO.builder()
                .tags(tags)
                .relationships(relationships)
                .build();
    }

    private List<String> parseLegacyTags(String rawJson) {
        try {
            String trimmed = rawJson.trim();
            if (trimmed.startsWith("[")) {
                String[] arr = objectMapper.readValue(trimmed, String[].class);
                return Arrays.stream(arr).filter(Objects::nonNull).map(String::trim).toList();
            }
            JsonNode node = objectMapper.readTree(trimmed);
            for (String field : List.of("tags", "keywords", "labels", "taxonomy")) {
                if (node.has(field) && node.get(field).isArray()) {
                    String[] arr = objectMapper.convertValue(node.get(field), String[].class);
                    return Arrays.stream(arr).filter(Objects::nonNull).map(String::trim).toList();
                }
            }
        } catch (Exception ignored) {}
        return Collections.emptyList();
    }

    private AiTagsResultDTO fallbackKeywords(ModerationQueueItem story) {
        String combined = ((story.getTitle() != null ? story.getTitle() : "") + " "
                + (story.getDescription() != null ? story.getDescription() : "")).toLowerCase();

        List<AiTagItemDTO> tags = new ArrayList<>();
        if (combined.contains("dance") || combined.contains("udarata") || combined.contains("natum")) {
            tags.add(AiTagItemDTO.builder().name("Kandyan Dance").category("dance").language("en").confidence(0.8).build());
        }
        if (combined.contains("drum") || combined.contains("bera")) {
            tags.add(AiTagItemDTO.builder().name("Traditional Drumming").category("music").language("en").confidence(0.8).build());
        }
        if (combined.contains("mask") || combined.contains("kolam")) {
            tags.add(AiTagItemDTO.builder().name("Traditional Masks").category("craft").language("en").confidence(0.8).build());
        }
        if (combined.contains("avurudu") || combined.contains("new year")) {
            tags.add(AiTagItemDTO.builder().name("Sinhala and Tamil New Year").category("festival").language("en").confidence(0.85).build());
        }
        if (combined.contains("game") || combined.contains("kreeda")) {
            tags.add(AiTagItemDTO.builder().name("Traditional Games").category("traditional_game").language("en").confidence(0.8).build());
        }

        if (tags.isEmpty()) {
            tags.add(AiTagItemDTO.builder().name("Cultural Heritage").category("heritage").language("en").confidence(0.7).build());
        }

        return AiTagsResultDTO.builder().tags(tags).build();
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
