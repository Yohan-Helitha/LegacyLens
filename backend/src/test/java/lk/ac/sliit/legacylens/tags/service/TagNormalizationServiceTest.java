package lk.ac.sliit.legacylens.tags.service;

import lk.ac.sliit.legacylens.tags.entity.*;
import lk.ac.sliit.legacylens.tags.repository.StoryTagRepository;
import lk.ac.sliit.legacylens.tags.repository.TagAliasRepository;
import lk.ac.sliit.legacylens.tags.repository.TagRelationshipRepository;
import lk.ac.sliit.legacylens.tags.repository.TagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagNormalizationServiceTest {

    @Mock
    private TagRepository tagRepository;
    @Mock
    private TagAliasRepository tagAliasRepository;
    @Mock
    private TagRelationshipRepository tagRelationshipRepository;
    @Mock
    private StoryTagRepository storyTagRepository;

    @InjectMocks
    private TagNormalizationService service;

    private Tag avuruduTag;

    @BeforeEach
    void setUp() {
        avuruduTag = new Tag("Sinhala and Tamil New Year", "sinhala and tamil new year",
                "New Year celebrations", "en", "festival", true);
        avuruduTag.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("Normalization: Casing and whitespace differences collapse to identical normalized string")
    void testNormalizeTagName_CasingAndWhitespace() {
        String n1 = service.normalizeTagName("  Kandyan-Dance  ");
        String n2 = service.normalizeTagName("kandyan dance");
        String n3 = service.normalizeTagName("#Kandyan_Dance");

        assertThat(n1).isEqualTo("kandyan dance");
        assertThat(n2).isEqualTo("kandyan dance");
        assertThat(n3).isEqualTo("kandyan dance");
    }

    @Test
    @DisplayName("Normalization: Preserves authentic Sinhala and Tamil Unicode terms")
    void testNormalizeTagName_PreservesUnicode() {
        String sinhala = service.normalizeTagName("අවුරුදු ක්‍රීඩා");
        String tamil = service.normalizeTagName("பொங்கல் பண்டிகை");

        assertThat(sinhala).isEqualTo("අවුරුදු ක්‍රීඩා");
        assertThat(tamil).isEqualTo("பொங்கல் பண்டிகை");
    }

    @Test
    @DisplayName("Resolution: Canonical name match returns canonical tag")
    void testResolveCanonicalTag_DirectMatch() {
        when(tagRepository.findByNormalizedName("sinhala and tamil new year")).thenReturn(Optional.of(avuruduTag));

        Optional<Tag> result = service.resolveCanonicalTag("Sinhala and Tamil New Year");

        assertThat(result).isPresent();
        assertThat(result.get().getCanonicalName()).isEqualTo("Sinhala and Tamil New Year");
    }

    @Test
    @DisplayName("Resolution: Alias match returns the canonical concept")
    void testResolveCanonicalTag_AliasMatch() {
        when(tagRepository.findByNormalizedName("avurudu")).thenReturn(Optional.empty());
        TagAlias alias = new TagAlias(avuruduTag, "Avurudu", "avurudu", "si-Latn", AliasType.SYNONYM);
        when(tagAliasRepository.findByNormalizedAlias("avurudu")).thenReturn(Optional.of(alias));

        Optional<Tag> result = service.resolveCanonicalTag("Avurudu");

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(avuruduTag.getId());
    }

    @Test
    @DisplayName("Aliases: Duplicate alias creation mapping to a different tag is rejected")
    void testAddTagAlias_RejectsCrossMapping() {
        UUID otherId = UUID.randomUUID();
        Tag otherTag = new Tag("Vesak Festival", "vesak festival", "Vesak", "en", "festival", true);
        otherTag.setId(otherId);

        when(tagRepository.findById(otherId)).thenReturn(Optional.of(otherTag));

        TagAlias existingAlias = new TagAlias(avuruduTag, "Avurudu", "avurudu", "si-Latn", AliasType.SYNONYM);
        when(tagAliasRepository.findByNormalizedAlias("avurudu")).thenReturn(Optional.of(existingAlias));

        assertThrows(IllegalStateException.class, () ->
                service.addTagAlias(otherId, "Avurudu", "en", AliasType.SYNONYM));
    }

    @Test
    @DisplayName("Relationships: Self-referential relationship is prevented")
    void testAddRelationship_SelfReferentialForbidden() {
        UUID tagId = avuruduTag.getId();
        assertThrows(IllegalArgumentException.class, () ->
                service.addTagRelationship(tagId, tagId, RelationshipType.RELATED_TO, 1.0));
    }

    @Test
    @DisplayName("Merge: Reassigns stories, aliases, and deletes source tag")
    void testMergeCanonicalTags() {
        UUID sourceId = UUID.randomUUID();
        Tag sourceTag = new Tag("Avurudu", "avurudu", "Old Avurudu tag", "si-Latn", "festival", true);
        sourceTag.setId(sourceId);

        when(tagRepository.findById(sourceId)).thenReturn(Optional.of(sourceTag));
        when(tagRepository.findById(avuruduTag.getId())).thenReturn(Optional.of(avuruduTag));

        UUID storyId = UUID.randomUUID();
        StoryTag storyTag = new StoryTag(storyId, sourceTag, 1.0, TagAssignmentSource.AI);
        when(storyTagRepository.findByTagId(sourceId)).thenReturn(List.of(storyTag));
        when(storyTagRepository.existsByStoryIdAndTagId(storyId, avuruduTag.getId())).thenReturn(false);

        when(tagAliasRepository.findByTagId(sourceId)).thenReturn(Collections.emptyList());
        when(tagRelationshipRepository.findAllByTagId(sourceId)).thenReturn(Collections.emptyList());

        service.mergeCanonicalTags(sourceId, avuruduTag.getId());

        verify(storyTagRepository).save(storyTag);
        assertThat(storyTag.getTag()).isEqualTo(avuruduTag);
        verify(tagRepository).delete(sourceTag);
    }
}

