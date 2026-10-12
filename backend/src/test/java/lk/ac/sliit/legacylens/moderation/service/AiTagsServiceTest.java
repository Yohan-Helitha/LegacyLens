package lk.ac.sliit.legacylens.moderation.service;

import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.tags.dto.AiTagsResultDTO;
import lk.ac.sliit.legacylens.tags.entity.Tag;
import lk.ac.sliit.legacylens.tags.entity.TagAssignmentSource;
import lk.ac.sliit.legacylens.tags.repository.StoryTagRepository;
import lk.ac.sliit.legacylens.tags.service.TagNormalizationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiTagsServiceTest {

    @Mock
    private GroqAiService groqAiService;
    @Mock
    private ModerationQueueRepository moderationQueueRepository;
    @Mock
    private TagNormalizationService tagNormalizationService;
    @Mock
    private StoryTagRepository storyTagRepository;

    @InjectMocks
    private AiTagsService service;

    @Test
    @DisplayName("AI Tag Parser: Parses valid structured JSON with tags and relationships")
    void testParseStructuredTags() {
        String json = """
        {
          "tags": [
            {
              "name": "Avurudu",
              "language": "si-Latn",
              "description": "Sinhala and Tamil New Year traditions",
              "category": "festival",
              "confidence": 0.95
            },
            {
              "name": "Traditional Games",
              "language": "en",
              "description": "Traditional village games",
              "category": "traditional_game",
              "confidence": 0.88
            }
          ],
          "relationships": [
            {
              "source": "Avurudu",
              "target": "Traditional Games",
              "type": "RELATED_TO"
            }
          ]
        }
        """;

        AiTagsResultDTO result = service.parseStructuredTags(json);

        assertThat(result.getTags()).hasSize(2);
        assertThat(result.getTags().get(0).getName()).isEqualTo("Avurudu");
        assertThat(result.getTags().get(0).getCategory()).isEqualTo("festival");
        assertThat(result.getRelationships()).hasSize(1);
        assertThat(result.getRelationships().get(0).getType()).isEqualTo("RELATED_TO");
    }

    @Test
    @DisplayName("AI Tag Generation: Normalizes and assigns canonical tags to story")
    void testGenerateAndResolveTagsForStory() {
        UUID storyId = UUID.randomUUID();
        ModerationQueueItem story = new ModerationQueueItem();
        story.setId(storyId);
        story.setTitle("Avurudu Celebrations in Matara");
        story.setDescription("Playing traditional games during new year");

        when(moderationQueueRepository.findById(storyId)).thenReturn(Optional.of(story));

        String mockJson = """
        {
          "tags": [
            { "name": "Avurudu", "category": "festival", "confidence": 0.95 }
          ],
          "relationships": []
        }
        """;
        when(groqAiService.generateStructuredTags(any(), any(), any(), any())).thenReturn(mockJson);

        Tag canonicalTag = new Tag("Avurudu", "avurudu", "New year", "si-Latn", "festival", true);
        canonicalTag.setId(UUID.randomUUID());

        when(tagNormalizationService.resolveCanonicalTag("Avurudu")).thenReturn(Optional.of(canonicalTag));
        when(tagNormalizationService.findOrCreateCanonicalTag(eq("Avurudu"), any(), any(), any(), eq(true)))
                .thenReturn(canonicalTag);
        when(tagNormalizationService.normalizeTagName("Avurudu")).thenReturn("avurudu");

        AiTagsResultDTO result = service.generateAndResolveTagsForStory(storyId);

        assertThat(result.getTags()).hasSize(1);
        assertThat(result.getTags().get(0).getName()).isEqualTo("Avurudu");
        verify(tagNormalizationService).assignTagToStory(eq(storyId), eq(canonicalTag.getId()), eq(0.95), eq(TagAssignmentSource.AI));
    }
}

