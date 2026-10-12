package lk.ac.sliit.legacylens.tags.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.tags.entity.*;
import lk.ac.sliit.legacylens.tags.repository.StoryTagRepository;
import lk.ac.sliit.legacylens.tags.repository.TagAliasRepository;
import lk.ac.sliit.legacylens.tags.repository.TagRelationshipRepository;
import lk.ac.sliit.legacylens.tags.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TagNormalizationService {

    private final TagRepository tagRepository;
    private final TagAliasRepository tagAliasRepository;
    private final TagRelationshipRepository tagRelationshipRepository;
    private final StoryTagRepository storyTagRepository;

    /**
     * Safely normalizes tag text for matching and duplicate detection:
     * - Unicode NFC normalization
     * - Strips leading '#' or quotation marks
     * - Lowercase (Unicode aware)
     * - Replaces internal punctuation/spaces/hyphens with a single space
     * - Preserves Sinhala, Tamil, English, and local scripts
     */
    public String normalizeTagName(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        // 1. Unicode NFC normalization
        String normalized = Normalizer.normalize(raw.trim(), Normalizer.Form.NFC);

        // 2. Strip leading #, @, quotes
        normalized = normalized.replaceAll("^[#@\"']+", "").replaceAll("[\"']+$", "").trim();

        // 3. Lowercase in ROOT locale (avoids Turkish I / language-specific casing side effects)
        normalized = normalized.toLowerCase(Locale.ROOT);

        // 4. Replace whitespace, hyphens, underscores, dots with single space
        normalized = normalized.replaceAll("[\\s\\-_.]+", " ").trim();

        // 5. Cap length
        if (normalized.length() > 150) {
            normalized = normalized.substring(0, 150).trim();
        }

        return normalized;
    }

    /**
     * Resolves a raw string to a canonical Tag:
     * 1. Checks exact match on canonical normalized_name
     * 2. Checks tag_aliases normalized_alias
     */
    @Transactional(readOnly = true)
    public Optional<Tag> resolveCanonicalTag(String rawName) {
        String normalized = normalizeTagName(rawName);
        if (normalized.isBlank()) {
            return Optional.empty();
        }

        // 1. Direct canonical name match
        Optional<Tag> directTag = tagRepository.findByNormalizedName(normalized);
        if (directTag.isPresent()) {
            return directTag;
        }

        // 2. Alias match
        Optional<TagAlias> alias = tagAliasRepository.findByNormalizedAlias(normalized);
        return alias.map(TagAlias::getTag);
    }

    /**
     * Finds an existing canonical concept or creates a new one idempotently.
     */
    @Transactional
    public Tag findOrCreateCanonicalTag(String canonicalName, String languageCode, String category, String description, boolean isApproved) {
        if (canonicalName == null || canonicalName.isBlank()) {
            throw new IllegalArgumentException("Canonical tag name cannot be blank");
        }

        String normalized = normalizeTagName(canonicalName);
        Optional<Tag> existing = resolveCanonicalTag(canonicalName);
        if (existing.isPresent()) {
            Tag tag = existing.get();
            // Enrich description or category if missing
            boolean updated = false;
            if ((tag.getDescription() == null || tag.getDescription().isBlank()) && description != null && !description.isBlank()) {
                tag.setDescription(description.trim());
                updated = true;
            }
            if ((tag.getCategory() == null || tag.getCategory().isBlank()) && category != null && !category.isBlank()) {
                tag.setCategory(category.trim());
                updated = true;
            }
            if (updated) {
                tagRepository.save(tag);
            }
            return tag;
        }

        // Create new canonical Tag
        Tag newTag = new Tag(
                canonicalName.trim().replaceAll("^[#]+", ""),
                normalized,
                description != null ? description.trim() : null,
                languageCode != null ? languageCode.trim() : "en",
                category != null ? category.trim() : "general",
                isApproved
        );

        return tagRepository.save(newTag);
    }

    /**
     * Adds an alias to an existing canonical concept.
     */
    @Transactional
    public TagAlias addTagAlias(UUID tagId, String aliasName, String languageCode, AliasType aliasType) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found with id: " + tagId));

        String normalized = normalizeTagName(aliasName);
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Alias name cannot be blank");
        }

        // Check if alias already maps to this tag
        Optional<TagAlias> existingAlias = tagAliasRepository.findByNormalizedAlias(normalized);
        if (existingAlias.isPresent()) {
            TagAlias current = existingAlias.get();
            if (current.getTag().getId().equals(tagId)) {
                return current;
            } else {
                throw new IllegalStateException("Alias '" + aliasName + "' is already mapped to canonical tag '"
                        + current.getTag().getCanonicalName() + "'");
            }
        }

        // Cannot create alias if it equals canonical tag's own name
        if (tag.getNormalizedName().equals(normalized)) {
            log.info("Alias '{}' matches canonical tag's own name, skipping redundant alias creation", aliasName);
            return null;
        }

        TagAlias alias = new TagAlias(
                tag,
                aliasName.trim().replaceAll("^[#]+", ""),
                normalized,
                languageCode != null ? languageCode : tag.getLanguageCode(),
                aliasType != null ? aliasType : AliasType.SYNONYM
        );

        return tagAliasRepository.save(alias);
    }

    @Transactional
    public void removeTagAlias(UUID aliasId) {
        tagAliasRepository.deleteById(aliasId);
    }

    /**
     * Creates or updates a conceptual relationship between two canonical tags.
     */
    @Transactional
    public TagRelationship addTagRelationship(UUID sourceTagId, UUID targetTagId, RelationshipType type, Double weight) {
        if (sourceTagId.equals(targetTagId)) {
            throw new IllegalArgumentException("Cannot create relationship from a tag to itself");
        }

        Tag source = tagRepository.findById(sourceTagId)
                .orElseThrow(() -> new ResourceNotFoundException("Source tag not found: " + sourceTagId));
        Tag target = tagRepository.findById(targetTagId)
                .orElseThrow(() -> new ResourceNotFoundException("Target tag not found: " + targetTagId));

        RelationshipType relType = type != null ? type : RelationshipType.RELATED_TO;
        double clampedWeight = (weight != null && weight >= 0.0 && weight <= 1.0) ? weight : 1.0;

        Optional<TagRelationship> existing = tagRelationshipRepository
                .findBySourceTagIdAndTargetTagIdAndRelationshipType(sourceTagId, targetTagId, relType);

        if (existing.isPresent()) {
            TagRelationship rel = existing.get();
            rel.setWeight(clampedWeight);
            return tagRelationshipRepository.save(rel);
        }

        TagRelationship rel = new TagRelationship(source, target, relType, clampedWeight);
        return tagRelationshipRepository.save(rel);
    }

    @Transactional
    public void removeTagRelationship(UUID relationshipId) {
        tagRelationshipRepository.deleteById(relationshipId);
    }

    /**
     * Gets all tags related to a given canonical tag.
     */
    @Transactional(readOnly = true)
    public List<Tag> getRelatedTags(UUID tagId) {
        List<TagRelationship> relationships = tagRelationshipRepository.findAllByTagId(tagId);
        List<Tag> related = new ArrayList<>();
        Set<UUID> seen = new HashSet<>();
        seen.add(tagId);

        for (TagRelationship rel : relationships) {
            Tag other = rel.getSourceTag().getId().equals(tagId) ? rel.getTargetTag() : rel.getSourceTag();
            if (seen.add(other.getId())) {
                related.add(other);
            }
        }
        return related;
    }

    /**
     * Assigns a canonical tag to a story idempotently.
     */
    @Transactional
    public StoryTag assignTagToStory(UUID storyId, UUID tagId, Double confidence, TagAssignmentSource source) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + tagId));

        Optional<StoryTag> existing = storyTagRepository.findByStoryIdAndTagId(storyId, tagId);
        if (existing.isPresent()) {
            StoryTag st = existing.get();
            // Upgrade source if ADMIN over AI/MIGRATION
            if (source == TagAssignmentSource.ADMIN) {
                st.setAssignmentSource(TagAssignmentSource.ADMIN);
                st.setConfidence(1.0);
                return storyTagRepository.save(st);
            }
            return st;
        }

        StoryTag storyTag = new StoryTag(storyId, tag, confidence, source);
        return storyTagRepository.save(storyTag);
    }

    /**
     * Removes a tag assignment from a story.
     */
    @Transactional
    public void removeTagFromStory(UUID storyId, UUID tagId) {
        storyTagRepository.deleteByStoryIdAndTagId(storyId, tagId);
    }

    /**
     * Merges sourceTag into targetTag:
     * 1. Reassigns all story_tags from source to target without duplicates
     * 2. Moves aliases from source to target
     * 3. Reassigns relationships (eliminates self-loops and duplicates)
     * 4. Converts sourceTag's canonical name into an alias of targetTag
     * 5. Deletes sourceTag safely
     */
    @Transactional
    public void mergeCanonicalTags(UUID sourceTagId, UUID targetTagId) {
        if (sourceTagId.equals(targetTagId)) {
            throw new IllegalArgumentException("Cannot merge a tag into itself");
        }

        Tag sourceTag = tagRepository.findById(sourceTagId)
                .orElseThrow(() -> new ResourceNotFoundException("Source tag not found: " + sourceTagId));
        Tag targetTag = tagRepository.findById(targetTagId)
                .orElseThrow(() -> new ResourceNotFoundException("Target tag not found: " + targetTagId));

        log.info("[TagMerge] Merging '{}' (id: {}) into '{}' (id: {})",
                sourceTag.getCanonicalName(), sourceTagId, targetTag.getCanonicalName(), targetTagId);

        // 1. Reassign story associations
        List<StoryTag> sourceStoryTags = storyTagRepository.findByTagId(sourceTagId);
        for (StoryTag st : sourceStoryTags) {
            boolean targetAlreadyAssigned = storyTagRepository.existsByStoryIdAndTagId(st.getStoryId(), targetTagId);
            if (targetAlreadyAssigned) {
                storyTagRepository.delete(st);
            } else {
                st.setTag(targetTag);
                storyTagRepository.save(st);
            }
        }

        // 2. Move aliases
        List<TagAlias> sourceAliases = tagAliasRepository.findByTagId(sourceTagId);
        for (TagAlias alias : sourceAliases) {
            if (alias.getNormalizedAlias().equals(targetTag.getNormalizedName())) {
                tagAliasRepository.delete(alias);
            } else {
                alias.setTag(targetTag);
                tagAliasRepository.save(alias);
            }
        }

        // Add source tag's name as an alias of target
        if (!sourceTag.getNormalizedName().equals(targetTag.getNormalizedName())
                && !tagAliasRepository.existsByNormalizedAlias(sourceTag.getNormalizedName())) {
            TagAlias newAlias = new TagAlias(
                    targetTag,
                    sourceTag.getCanonicalName(),
                    sourceTag.getNormalizedName(),
                    sourceTag.getLanguageCode(),
                    AliasType.SYNONYM
            );
            tagAliasRepository.save(newAlias);
        }

        // 3. Reconcile relationships
        List<TagRelationship> sourceRels = tagRelationshipRepository.findAllByTagId(sourceTagId);
        for (TagRelationship rel : sourceRels) {
            UUID otherTagId = rel.getSourceTag().getId().equals(sourceTagId)
                    ? rel.getTargetTag().getId()
                    : rel.getSourceTag().getId();

            // Self-loop prevention
            if (otherTagId.equals(targetTagId)) {
                tagRelationshipRepository.delete(rel);
                continue;
            }

            Tag otherTag = rel.getSourceTag().getId().equals(sourceTagId) ? rel.getTargetTag() : rel.getSourceTag();
            boolean isSource = rel.getSourceTag().getId().equals(sourceTagId);

            Tag newSource = isSource ? targetTag : otherTag;
            Tag newTarget = isSource ? otherTag : targetTag;

            boolean duplicateExists = tagRelationshipRepository
                    .existsBySourceTagIdAndTargetTagIdAndRelationshipType(
                            newSource.getId(), newTarget.getId(), rel.getRelationshipType());

            if (duplicateExists) {
                tagRelationshipRepository.delete(rel);
            } else {
                rel.setSourceTag(newSource);
                rel.setTargetTag(newTarget);
                tagRelationshipRepository.save(rel);
            }
        }

        // 4. Finally delete the merged source tag
        tagRepository.delete(sourceTag);
        log.info("[TagMerge] Merge complete: source tag {} deleted, associations moved to {}", sourceTagId, targetTagId);
    }
}

