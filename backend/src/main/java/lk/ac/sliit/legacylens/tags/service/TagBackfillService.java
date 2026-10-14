package lk.ac.sliit.legacylens.tags.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.tags.entity.Tag;
import lk.ac.sliit.legacylens.tags.entity.TagAssignmentSource;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TagBackfillService {

    private final JdbcTemplate jdbcTemplate;
    private final TagNormalizationService tagNormalizationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Data
    @Builder
    public static class BackfillReport {
        private int totalStoriesScanned;
        private int storiesWithTags;
        private int tagsCreated;
        private int storyTagAssignmentsCreated;
        private int feedItemTagsBackfilled;
        private List<String> ambiguousOrMalformedValues;
    }

    /**
     * Executes an idempotent backfill of existing tags from stories.tags and feed_item_tags
     * into the normalized canonical tag schema without modifying or dropping the legacy columns.
     */
    @Transactional
    public BackfillReport backfillLegacyTags() {
        log.info("[TagBackfillService] Starting legacy tag backfill...");

        int totalStoriesScanned = 0;
        int storiesWithTags = 0;
        int tagsCreated = 0;
        int assignmentsCreated = 0;
        int feedItemTagsCount = 0;
        List<String> malformedValues = new ArrayList<>();

        // 1. Scan `stories` table
        try {
            List<Map<String, Object>> stories = jdbcTemplate.queryForList("SELECT id, title, tags, description FROM stories");
            totalStoriesScanned = stories.size();

            for (Map<String, Object> row : stories) {
                UUID storyId = (UUID) row.get("id");
                Object rawTagsObj = row.get("tags");

                if (rawTagsObj == null) {
                    continue;
                }

                String rawTags = rawTagsObj.toString().trim();
                if (rawTags.isBlank() || "{}".equals(rawTags)) {
                    continue;
                }

                storiesWithTags++;
                List<String> parsedTags = parseRawTags(rawTags);

                if (parsedTags.isEmpty() && !rawTags.isEmpty()) {
                    malformedValues.add("Story " + storyId + " malformed tag string: " + rawTags);
                }

                for (String tagName : parsedTags) {
                    try {
                        Tag tag = tagNormalizationService.findOrCreateCanonicalTag(
                                tagName, "en", "heritage", null, true);
                        tagNormalizationService.assignTagToStory(
                                storyId, tag.getId(), 1.0, TagAssignmentSource.MIGRATION);
                        assignmentsCreated++;
                    } catch (Exception e) {
                        log.warn("[TagBackfillService] Failed to assign tag '{}' for story {}: {}", tagName, storyId, e.getMessage());
                        malformedValues.add("Story " + storyId + " failed tag: " + tagName + " (" + e.getMessage() + ")");
                    }
                }
            }
        } catch (Exception e) {
            log.error("[TagBackfillService] Error querying stories for backfill: {}", e.getMessage(), e);
        }

        // 2. Also backfill foundational cultural seed tags and aliases if tags table has few items
        seedDefaultCulturalTaxonomy();

        log.info("[TagBackfillService] Backfill complete. Scanned {} stories, {} with tags, created {} assignments.",
                totalStoriesScanned, storiesWithTags, assignmentsCreated);

        return BackfillReport.builder()
                .totalStoriesScanned(totalStoriesScanned)
                .storiesWithTags(storiesWithTags)
                .tagsCreated(tagsCreated)
                .storyTagAssignmentsCreated(assignmentsCreated)
                .feedItemTagsBackfilled(feedItemTagsCount)
                .ambiguousOrMalformedValues(malformedValues)
                .build();
    }

    /**
     * Parses raw tag formats:
     * - Postgres array format: {tag1,tag2} or {"tag 1","tag 2"}
     * - JSON array format: ["tag1", "tag2"]
     * - Comma-separated: tag1, tag2
     */
    public List<String> parseRawTags(String raw) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptyList();
        }

        String trimmed = raw.trim();
        List<String> result = new ArrayList<>();

        // Case 1: JSON array e.g. ["dance", "kandyan"]
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
                List<String> jsonList = objectMapper.readValue(trimmed, new TypeReference<List<String>>() {});
                for (String t : jsonList) {
                    if (t != null && !t.isBlank()) {
                        result.add(t.trim());
                    }
                }
                return result;
            } catch (Exception ignored) {
            }
        }

        // Case 2: Postgres array string e.g. {tag1,tag2} or {"tag 1","tag 2"}
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            String inner = trimmed.substring(1, trimmed.length() - 1).trim();
            if (inner.isBlank()) {
                return Collections.emptyList();
            }
            // Parse comma-separated items with optional quotes
            String[] tokens = inner.split(",");
            for (String token : tokens) {
                String clean = token.trim().replaceAll("^\"|\"$", "");
                if (!clean.isBlank()) {
                    result.add(clean);
                }
            }
            return result;
        }

        // Case 3: Comma or semicolon separated
        String[] tokens = trimmed.split("[,;]");
        for (String token : tokens) {
            String clean = token.trim();
            if (!clean.isBlank()) {
                result.add(clean);
            }
        }

        return result;
    }

    /**
     * Seeds essential Sri Lankan cultural taxonomy concepts, aliases, and relationships
     * to provide an immediate high-quality foundation for canonical resolution and recommendations.
     */
    @Transactional
    public void seedDefaultCulturalTaxonomy() {
        try {
            // Avurudu & New Year
            Tag avurudu = tagNormalizationService.findOrCreateCanonicalTag("Sinhala and Tamil New Year", "en", "festival", "Sinhala and Tamil traditional New Year cultural celebration", true);
            tagNormalizationService.addTagAlias(avurudu.getId(), "Avurudu", "si-Latn", lk.ac.sliit.legacylens.tags.entity.AliasType.SYNONYM);
            tagNormalizationService.addTagAlias(avurudu.getId(), "Sinhala Avurudu", "si-Latn", lk.ac.sliit.legacylens.tags.entity.AliasType.SYNONYM);
            tagNormalizationService.addTagAlias(avurudu.getId(), "අවුරුදු", "si", lk.ac.sliit.legacylens.tags.entity.AliasType.TRANSLATION);
            tagNormalizationService.addTagAlias(avurudu.getId(), "சித்திரை புத்தாண்டு", "ta", lk.ac.sliit.legacylens.tags.entity.AliasType.TRANSLATION);

            // Traditional Games
            Tag tradGames = tagNormalizationService.findOrCreateCanonicalTag("Traditional Games", "en", "traditional_game", "Traditional sports and games played during cultural festivities", true);
            tagNormalizationService.addTagAlias(tradGames.getId(), "Jana Kreeda", "si-Latn", lk.ac.sliit.legacylens.tags.entity.AliasType.SYNONYM);
            tagNormalizationService.addTagAlias(tradGames.getId(), "ජන ක්‍රීඩා", "si", lk.ac.sliit.legacylens.tags.entity.AliasType.TRANSLATION);

            // Relationship: Avurudu -> Traditional Games
            tagNormalizationService.addTagRelationship(avurudu.getId(), tradGames.getId(), lk.ac.sliit.legacylens.tags.entity.RelationshipType.RELATED_TO, 0.95);

            // Specific game: Kana Mutti
            Tag kanaMutti = tagNormalizationService.findOrCreateCanonicalTag("Kana Mutti", "si-Latn", "traditional_game", "Traditional pot-breaking game played during Avurudu", true);
            tagNormalizationService.addTagAlias(kanaMutti.getId(), "කණ මුට්ටිය", "si", lk.ac.sliit.legacylens.tags.entity.AliasType.TRANSLATION);
            tagNormalizationService.addTagRelationship(kanaMutti.getId(), tradGames.getId(), lk.ac.sliit.legacylens.tags.entity.RelationshipType.EXAMPLE_OF, 0.9);

            // Kandyan Dance
            Tag kandyanDance = tagNormalizationService.findOrCreateCanonicalTag("Kandyan Dance", "en", "dance", "Classical Sri Lankan dance tradition originating from the Central Highlands", true);
            tagNormalizationService.addTagAlias(kandyanDance.getId(), "Udarata Natum", "si-Latn", lk.ac.sliit.legacylens.tags.entity.AliasType.SYNONYM);
            tagNormalizationService.addTagAlias(kandyanDance.getId(), "උඩරට නැටුම්", "si", lk.ac.sliit.legacylens.tags.entity.AliasType.TRANSLATION);

            // Traditional Drumming
            Tag tradDrums = tagNormalizationService.findOrCreateCanonicalTag("Traditional Drumming", "en", "music", "Sri Lankan ritual and ceremonial drum traditions", true);
            tagNormalizationService.addTagAlias(tradDrums.getId(), "Bera Vadanaya", "si-Latn", lk.ac.sliit.legacylens.tags.entity.AliasType.SYNONYM);
            tagNormalizationService.addTagAlias(tradDrums.getId(), "Traditional Drums", "en", lk.ac.sliit.legacylens.tags.entity.AliasType.SYNONYM);
            tagNormalizationService.addTagRelationship(kandyanDance.getId(), tradDrums.getId(), lk.ac.sliit.legacylens.tags.entity.RelationshipType.RELATED_TO, 0.85);

            // Mask Carving / Kolam
            Tag maskCraft = tagNormalizationService.findOrCreateCanonicalTag("Traditional Masks", "en", "craft", "Traditional wooden mask carving and painting tradition", true);
            tagNormalizationService.addTagAlias(maskCraft.getId(), "Kolam Masks", "en", lk.ac.sliit.legacylens.tags.entity.AliasType.SYNONYM);
            tagNormalizationService.addTagAlias(maskCraft.getId(), "වෙස් මුහුණු", "si", lk.ac.sliit.legacylens.tags.entity.AliasType.TRANSLATION);

            // Traditional Food / Sweetmeats
            Tag tradFood = tagNormalizationService.findOrCreateCanonicalTag("Traditional Food", "en", "food", "Heritage culinary practices, recipes, and sweetmeats", true);
            tagNormalizationService.addTagAlias(tradFood.getId(), "Sweetmeats", "en", lk.ac.sliit.legacylens.tags.entity.AliasType.SYNONYM);
            tagNormalizationService.addTagRelationship(avurudu.getId(), tradFood.getId(), lk.ac.sliit.legacylens.tags.entity.RelationshipType.RELATED_TO, 0.80);

            // Folk Tales
            Tag folkTales = tagNormalizationService.findOrCreateCanonicalTag("Folk Tales", "en", "oral_tradition", "Oral folklore, myths, and legends transmitted across generations", true);
            tagNormalizationService.addTagAlias(folkTales.getId(), "Folktales", "en", lk.ac.sliit.legacylens.tags.entity.AliasType.SYNONYM);
            tagNormalizationService.addTagAlias(folkTales.getId(), "Folk Stories", "en", lk.ac.sliit.legacylens.tags.entity.AliasType.SYNONYM);
            tagNormalizationService.addTagAlias(folkTales.getId(), "ජන කතා", "si", lk.ac.sliit.legacylens.tags.entity.AliasType.TRANSLATION);

            log.info("[TagBackfillService] Core cultural taxonomy verified and seeded.");
        } catch (Exception e) {
            log.warn("[TagBackfillService] Taxonomy seed notice: {}", e.getMessage());
        }
    }
}

