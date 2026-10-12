package lk.ac.sliit.legacylens.discovery.service;

import lk.ac.sliit.legacylens.discovery.dto.DiscoveryStoryResponse;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.tags.entity.StoryTag;
import lk.ac.sliit.legacylens.tags.entity.Tag;
import lk.ac.sliit.legacylens.tags.entity.TagAssignmentSource;
import lk.ac.sliit.legacylens.tags.repository.StoryTagRepository;
import lk.ac.sliit.legacylens.tags.repository.TagAliasRepository;
import lk.ac.sliit.legacylens.tags.repository.TagRepository;
import lk.ac.sliit.legacylens.tags.service.TagNormalizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CulturalDiscoveryServiceTest {

    @Mock
    private ModerationQueueRepository moderationQueueRepository;
    @Mock
    private StoryTagRepository storyTagRepository;
    @Mock
    private TagRepository tagRepository;
    @Mock
    private TagAliasRepository tagAliasRepository;
    @Mock
    private TagNormalizationService tagNormalizationService;
    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private CulturalDiscoveryService service;

    private Tag avuruduTag;
    private Tag gamesTag;
    private Tag danceTag;
    private ModerationQueueItem story1;
    private ModerationQueueItem story2;

    @BeforeEach
    void setUp() {
        avuruduTag = new Tag("Sinhala and Tamil New Year", "sinhala and tamil new year", "Festival", "en", "festival", true);
        avuruduTag.setId(UUID.randomUUID());

        gamesTag = new Tag("Traditional Games", "traditional games", "Games", "en", "traditional_game", true);
        gamesTag.setId(UUID.randomUUID());

        danceTag = new Tag("Kandyan Dance", "kandyan dance", "Dance", "en", "dance", true);
        danceTag.setId(UUID.randomUUID());

        story1 = new ModerationQueueItem();
        story1.setId(UUID.randomUUID());
        story1.setTitle("Avurudu Rites");
        story1.setDescription("Traditional customs of the new year");
        story1.setStatus(StoryStatus.PUBLISHED);
        story1.setPublishedAt(LocalDateTime.now().minusDays(1));
        story1.setLikesCount(10);

        story2 = new ModerationQueueItem();
        story2.setId(UUID.randomUUID());
        story2.setTitle("Kandyan Drumming & Dance");
        story2.setDescription("Temple drumming traditions in Kandy");
        story2.setStatus(StoryStatus.PUBLISHED);
        story2.setPublishedAt(LocalDateTime.now().minusDays(2));
        story2.setLikesCount(5);
    }

    @Test
    @DisplayName("Search: Matches stories by canonical tag and ranks by relevance")
    void testSearchPublishedStories() {
        when(moderationQueueRepository.findByStatus(StoryStatus.PUBLISHED)).thenReturn(List.of(story1, story2));

        StoryTag st1 = new StoryTag(story1.getId(), avuruduTag, 1.0, TagAssignmentSource.AI);
        StoryTag st2 = new StoryTag(story2.getId(), danceTag, 1.0, TagAssignmentSource.AI);
        when(storyTagRepository.findByStoryIdIn(any())).thenReturn(List.of(st1, st2));

        when(tagNormalizationService.normalizeTagName(any())).thenAnswer(inv -> inv.getArgument(0) != null ? inv.getArgument(0).toString().trim().toLowerCase() : "");
        when(tagNormalizationService.resolveCanonicalTag("Avurudu")).thenReturn(Optional.of(avuruduTag));
        when(tagRepository.findAll()).thenReturn(List.of(avuruduTag, danceTag));
        when(tagAliasRepository.findAll()).thenReturn(Collections.emptyList());

        Page<DiscoveryStoryResponse> results = service.searchPublishedStories(
                "Avurudu", null, null, null, null, false, 0, 10);

        assertThat(results.getContent()).isNotEmpty();
        assertThat(results.getContent().get(0).getId()).isEqualTo(story1.getId());
    }

    @Test
    @DisplayName("Related Stories: Excludes current story and ranks by Jaccard tag similarity")
    void testGetRelatedStories_ExcludesCurrentStory() {
        when(moderationQueueRepository.findById(story1.getId())).thenReturn(Optional.of(story1));
        when(storyTagRepository.findTagsByStoryId(story1.getId())).thenReturn(List.of(avuruduTag, gamesTag));
        when(tagNormalizationService.getRelatedTags(any())).thenReturn(Collections.emptyList());

        ModerationQueueItem story3 = new ModerationQueueItem();
        story3.setId(UUID.randomUUID());
        story3.setTitle("Village Games");
        story3.setDescription("Old games");
        story3.setStatus(StoryStatus.PUBLISHED);

        when(moderationQueueRepository.findByStatus(StoryStatus.PUBLISHED)).thenReturn(List.of(story1, story2, story3));

        StoryTag st2 = new StoryTag(story2.getId(), danceTag, 1.0, TagAssignmentSource.AI);
        StoryTag st3 = new StoryTag(story3.getId(), gamesTag, 1.0, TagAssignmentSource.AI);
        when(storyTagRepository.findByStoryIdIn(any())).thenReturn(List.of(st2, st3));

        List<DiscoveryStoryResponse> related = service.getRelatedStories(story1.getId(), 4);

        // story1 must NOT be in its own recommendations
        assertThat(related).noneMatch(r -> r.getId().equals(story1.getId()));
        // story3 shares 'gamesTag' with story1, so it should rank higher than story2
        assertThat(related).isNotEmpty();
        assertThat(related.get(0).getId()).isEqualTo(story3.getId());
    }

    @Test
    @DisplayName("Personalized Home: Recommends stories matching user viewing profile")
    void testPersonalizedRecommendations() {
        UUID viewerId = UUID.randomUUID();
        when(moderationQueueRepository.findByStatus(StoryStatus.PUBLISHED)).thenReturn(List.of(story1, story2));

        StoryTag st1 = new StoryTag(story1.getId(), avuruduTag, 1.0, TagAssignmentSource.AI);
        StoryTag st2 = new StoryTag(story2.getId(), danceTag, 1.0, TagAssignmentSource.AI);
        when(storyTagRepository.findByStoryIdIn(any())).thenReturn(List.of(st1, st2));

        // Mock recent view of an Avurudu story
        Map<String, Object> viewRow = Map.of(
                "story_id", story1.getId(),
                "viewed_at", LocalDateTime.now().minusHours(24)
        );
        when(jdbcTemplate.queryForList(anyString(), eq(viewerId))).thenReturn(List.of(viewRow));
        when(tagNormalizationService.getRelatedTags(any())).thenReturn(Collections.emptyList());

        List<DiscoveryStoryResponse> recommendations = service.getPersonalizedRecommendations(viewerId, 5);

        assertThat(recommendations).isNotEmpty();
    }
}
