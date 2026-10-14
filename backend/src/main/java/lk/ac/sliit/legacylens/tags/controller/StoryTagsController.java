package lk.ac.sliit.legacylens.tags.controller;

import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.tags.dto.AiTagItemDTO;
import lk.ac.sliit.legacylens.tags.entity.StoryTag;
import lk.ac.sliit.legacylens.tags.entity.Tag;
import lk.ac.sliit.legacylens.tags.entity.TagAssignmentSource;
import lk.ac.sliit.legacylens.tags.repository.StoryTagRepository;
import lk.ac.sliit.legacylens.tags.service.TagNormalizationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/stories/{storyId}/tags")
@RequiredArgsConstructor
public class StoryTagsController {

    private final StoryTagRepository storyTagRepository;
    private final TagNormalizationService tagNormalizationService;

    @Data
    public static class AssignTagRequest {
        private UUID tagId;
        private String tagName;
        private String category;
        private Double confidence;
        private String source;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AiTagItemDTO>>> getStoryTags(@PathVariable UUID storyId) {
        List<StoryTag> storyTags = storyTagRepository.findByStoryId(storyId);
        List<AiTagItemDTO> dtos = storyTags.stream()
                .map(st -> AiTagItemDTO.builder()
                        .tagId(st.getTag().getId())
                        .name(st.getTag().getCanonicalName())
                        .category(st.getTag().getCategory())
                        .language(st.getTag().getLanguageCode())
                        .description(st.getTag().getDescription())
                        .confidence(st.getConfidence())
                        .isNew(false)
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AiTagItemDTO>> assignTag(
            @PathVariable UUID storyId,
            @RequestBody AssignTagRequest request) {

        Tag tag;
        if (request.getTagId() != null) {
            tag = tagNormalizationService.resolveCanonicalTag(request.getTagId().toString())
                    .orElseGet(() -> tagNormalizationService.findOrCreateCanonicalTag(
                            request.getTagName() != null ? request.getTagName() : "Tag", "en", request.getCategory(), null, true));
        } else if (request.getTagName() != null && !request.getTagName().isBlank()) {
            tag = tagNormalizationService.findOrCreateCanonicalTag(
                    request.getTagName(), "en", request.getCategory(), null, true);
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Either tagId or tagName is required"));
        }

        TagAssignmentSource source = TagAssignmentSource.ADMIN;
        if (request.getSource() != null) {
            try {
                source = TagAssignmentSource.valueOf(request.getSource().toUpperCase());
            } catch (Exception ignored) {}
        }

        StoryTag storyTag = tagNormalizationService.assignTagToStory(
                storyId, tag.getId(), request.getConfidence() != null ? request.getConfidence() : 1.0, source);

        AiTagItemDTO dto = AiTagItemDTO.builder()
                .tagId(tag.getId())
                .name(tag.getCanonicalName())
                .category(tag.getCategory())
                .language(tag.getLanguageCode())
                .description(tag.getDescription())
                .confidence(storyTag.getConfidence())
                .isNew(false)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Tag assigned to story", dto));
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<ApiResponse<Void>> removeTag(
            @PathVariable UUID storyId,
            @PathVariable UUID tagId) {

        tagNormalizationService.removeTagFromStory(storyId, tagId);
        return ResponseEntity.ok(ApiResponse.ok("Tag unassigned from story", null));
    }
}
