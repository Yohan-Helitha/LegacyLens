package lk.ac.sliit.legacylens.tags.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.tags.dto.*;
import lk.ac.sliit.legacylens.tags.entity.*;
import lk.ac.sliit.legacylens.tags.repository.StoryTagRepository;
import lk.ac.sliit.legacylens.tags.repository.TagAliasRepository;
import lk.ac.sliit.legacylens.tags.repository.TagRelationshipRepository;
import lk.ac.sliit.legacylens.tags.repository.TagRepository;
import lk.ac.sliit.legacylens.tags.service.TagBackfillService;
import lk.ac.sliit.legacylens.tags.service.TagNormalizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class TagController {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final TagRepository tagRepository;
    private final TagAliasRepository tagAliasRepository;
    private final TagRelationshipRepository tagRelationshipRepository;
    private final StoryTagRepository storyTagRepository;
    private final TagNormalizationService tagNormalizationService;
    private final TagBackfillService tagBackfillService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TagDTO>>> listTags(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean isApproved,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("canonicalName").ascending());
        Page<Tag> tagPage = tagRepository.searchTags(
                (search != null && !search.isBlank()) ? search.trim() : null,
                (category != null && !category.isBlank()) ? category.trim() : null,
                isApproved,
                pageRequest
        );

        Page<TagDTO> dtoPage = tagPage.map(this::mapToSummaryDTO);
        return ResponseEntity.ok(ApiResponse.ok(dtoPage));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TagDTO>> createTag(@Valid @RequestBody CreateTagRequest request) {
        Tag tag = tagNormalizationService.findOrCreateCanonicalTag(
                request.getCanonicalName(),
                request.getLanguageCode(),
                request.getCategory(),
                request.getDescription(),
                request.getIsApproved() == null || request.getIsApproved()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Tag created", mapToDetailDTO(tag)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TagDTO>> getTag(@PathVariable UUID id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + id));
        return ResponseEntity.ok(ApiResponse.ok(mapToDetailDTO(tag)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TagDTO>> updateTag(
            @PathVariable UUID id,
            @Valid @RequestBody CreateTagRequest request) {

        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + id));

        tag.setCanonicalName(request.getCanonicalName().trim());
        tag.setNormalizedName(tagNormalizationService.normalizeTagName(request.getCanonicalName()));
        if (request.getDescription() != null) tag.setDescription(request.getDescription().trim());
        if (request.getLanguageCode() != null) tag.setLanguageCode(request.getLanguageCode().trim());
        if (request.getCategory() != null) tag.setCategory(request.getCategory().trim());
        if (request.getIsApproved() != null) tag.setApproved(request.getIsApproved());

        Tag saved = tagRepository.save(tag);
        return ResponseEntity.ok(ApiResponse.ok("Tag updated", mapToDetailDTO(saved)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable UUID id) {
        if (!tagRepository.existsById(id)) {
            throw new ResourceNotFoundException("Tag not found: " + id);
        }
        tagRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Tag deleted", null));
    }

    @GetMapping("/resolve")
    public ResponseEntity<ApiResponse<TagDTO>> resolveTag(@RequestParam String query) {
        Optional<Tag> resolved = tagNormalizationService.resolveCanonicalTag(query);
        return resolved
                .map(tag -> ResponseEntity.ok(ApiResponse.ok(mapToDetailDTO(tag))))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Tag not resolved")));
    }

    @PostMapping("/{id}/aliases")
    public ResponseEntity<ApiResponse<TagAliasDTO>> addAlias(
            @PathVariable UUID id,
            @Valid @RequestBody AddAliasRequest request) {

        AliasType type = AliasType.SYNONYM;
        if (request.getAliasType() != null) {
            try {
                type = AliasType.valueOf(request.getAliasType().toUpperCase());
            } catch (Exception ignored) {}
        }

        TagAlias alias = tagNormalizationService.addTagAlias(
                id, request.getAlias(), request.getLanguageCode(), type);

        if (alias == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Alias could not be added"));
        }

        TagAliasDTO dto = TagAliasDTO.builder()
                .id(alias.getId())
                .tagId(id)
                .alias(alias.getAlias())
                .normalizedAlias(alias.getNormalizedAlias())
                .languageCode(alias.getLanguageCode())
                .aliasType(alias.getAliasType().name())
                .createdAt(alias.getCreatedAt() != null ? alias.getCreatedAt().format(DATE_FORMATTER) : null)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Alias added", dto));
    }

    @DeleteMapping("/aliases/{aliasId}")
    public ResponseEntity<ApiResponse<Void>> removeAlias(@PathVariable UUID aliasId) {
        tagNormalizationService.removeTagAlias(aliasId);
        return ResponseEntity.ok(ApiResponse.ok("Alias removed", null));
    }

    @PostMapping("/{id}/relationships")
    public ResponseEntity<ApiResponse<TagRelationshipDTO>> addRelationship(
            @PathVariable UUID id,
            @Valid @RequestBody AddRelationshipRequest request) {

        RelationshipType type = RelationshipType.RELATED_TO;
        if (request.getRelationshipType() != null) {
            try {
                type = RelationshipType.valueOf(request.getRelationshipType().toUpperCase());
            } catch (Exception ignored) {}
        }

        TagRelationship rel = tagNormalizationService.addTagRelationship(
                id, request.getTargetTagId(), type, request.getWeight());

        TagRelationshipDTO dto = TagRelationshipDTO.builder()
                .id(rel.getId())
                .sourceTagId(rel.getSourceTag().getId())
                .sourceTagName(rel.getSourceTag().getCanonicalName())
                .targetTagId(rel.getTargetTag().getId())
                .targetTagName(rel.getTargetTag().getCanonicalName())
                .relationshipType(rel.getRelationshipType().name())
                .weight(rel.getWeight())
                .createdAt(rel.getCreatedAt() != null ? rel.getCreatedAt().format(DATE_FORMATTER) : null)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Relationship created", dto));
    }

    @DeleteMapping("/relationships/{relId}")
    public ResponseEntity<ApiResponse<Void>> removeRelationship(@PathVariable UUID relId) {
        tagNormalizationService.removeTagRelationship(relId);
        return ResponseEntity.ok(ApiResponse.ok("Relationship removed", null));
    }

    @PostMapping("/merge")
    public ResponseEntity<ApiResponse<Void>> mergeTags(@Valid @RequestBody MergeTagsRequest request) {
        tagNormalizationService.mergeCanonicalTags(request.getSourceTagId(), request.getTargetTagId());
        return ResponseEntity.ok(ApiResponse.ok("Tags successfully merged", null));
    }

    @PostMapping("/backfill")
    public ResponseEntity<ApiResponse<TagBackfillService.BackfillReport>> triggerBackfill() {
        TagBackfillService.BackfillReport report = tagBackfillService.backfillLegacyTags();
        return ResponseEntity.ok(ApiResponse.ok("Legacy tags backfilled", report));
    }

    private TagDTO mapToSummaryDTO(Tag tag) {
        return TagDTO.builder()
                .id(tag.getId())
                .canonicalName(tag.getCanonicalName())
                .normalizedName(tag.getNormalizedName())
                .description(tag.getDescription())
                .languageCode(tag.getLanguageCode())
                .category(tag.getCategory())
                .isApproved(tag.isApproved())
                .createdAt(tag.getCreatedAt() != null ? tag.getCreatedAt().format(DATE_FORMATTER) : null)
                .updatedAt(tag.getUpdatedAt() != null ? tag.getUpdatedAt().format(DATE_FORMATTER) : null)
                .build();
    }

    private TagDTO mapToDetailDTO(Tag tag) {
        List<TagAliasDTO> aliasDTOs = tagAliasRepository.findByTagId(tag.getId()).stream()
                .map(a -> TagAliasDTO.builder()
                        .id(a.getId())
                        .tagId(tag.getId())
                        .alias(a.getAlias())
                        .normalizedAlias(a.getNormalizedAlias())
                        .languageCode(a.getLanguageCode())
                        .aliasType(a.getAliasType() != null ? a.getAliasType().name() : "SYNONYM")
                        .createdAt(a.getCreatedAt() != null ? a.getCreatedAt().format(DATE_FORMATTER) : null)
                        .build())
                .collect(Collectors.toList());

        List<TagRelationshipDTO> relDTOs = tagRelationshipRepository.findAllByTagId(tag.getId()).stream()
                .map(r -> TagRelationshipDTO.builder()
                        .id(r.getId())
                        .sourceTagId(r.getSourceTag().getId())
                        .sourceTagName(r.getSourceTag().getCanonicalName())
                        .targetTagId(r.getTargetTag().getId())
                        .targetTagName(r.getTargetTag().getCanonicalName())
                        .relationshipType(r.getRelationshipType().name())
                        .weight(r.getWeight())
                        .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().format(DATE_FORMATTER) : null)
                        .build())
                .collect(Collectors.toList());

        return TagDTO.builder()
                .id(tag.getId())
                .canonicalName(tag.getCanonicalName())
                .normalizedName(tag.getNormalizedName())
                .description(tag.getDescription())
                .languageCode(tag.getLanguageCode())
                .category(tag.getCategory())
                .isApproved(tag.isApproved())
                .aliases(aliasDTOs)
                .relationships(relDTOs)
                .createdAt(tag.getCreatedAt() != null ? tag.getCreatedAt().format(DATE_FORMATTER) : null)
                .updatedAt(tag.getUpdatedAt() != null ? tag.getUpdatedAt().format(DATE_FORMATTER) : null)
                .build();
    }
}
