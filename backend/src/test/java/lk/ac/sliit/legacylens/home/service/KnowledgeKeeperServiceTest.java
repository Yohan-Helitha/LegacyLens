package lk.ac.sliit.legacylens.home.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.home.dto.FeaturedKeeperResponse;
import lk.ac.sliit.legacylens.home.entity.FeaturedKeeper;
import lk.ac.sliit.legacylens.home.repository.FeaturedKeeperRepository;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.moderation.service.GroqAiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KnowledgeKeeperServiceTest {

    @Mock
    private FeaturedKeeperRepository repository;

    @Mock
    private ModerationQueueRepository moderationQueueRepository;

    @Mock
    private GroqAiService groqAiService;

    private KnowledgeKeeperService service;

    @BeforeEach
    void setUp() {
        service = new KnowledgeKeeperService(repository, moderationQueueRepository, groqAiService);
    }

    @Test
    void getFeaturedKeeperOfToday_whenTodayKeeperExists_returnsKeeper() {
        LocalDate today = LocalDate.now();
        FeaturedKeeper keeper = new FeaturedKeeper();
        keeper.setId(1L);
        keeper.setName("Somalatha Jayasuriya");
        keeper.setTitle("Master Brass Artisan");
        keeper.setTag("BRASS & METALWORK");
        keeper.setQuote("The brass lamp illuminates ancestral wisdom.");
        keeper.setAvatarUrl("https://example.com/avatar.jpg");
        keeper.setActiveDate(today);
        keeper.setStatus("Active");
        keeper.setLikesCount(150);

        when(repository.findByActiveDateAndStatus(today, "Active")).thenReturn(Optional.of(keeper));

        FeaturedKeeperResponse response = service.getFeaturedKeeperOfToday();

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Somalatha Jayasuriya");
        assertThat(response.getTitle()).isEqualTo("Master Brass Artisan");
        assertThat(response.getQuote()).contains("ancestral wisdom");
        assertThat(response.getLikesCount()).isEqualTo(150);
    }

    @Test
    void getFeaturedKeeperOfToday_whenNoKeeperForToday_rotatesDeterministically() {
        LocalDate today = LocalDate.now();
        when(repository.findByActiveDateAndStatus(today, "Active")).thenReturn(Optional.empty());
        when(repository.findFirstByActiveDate(today)).thenReturn(Optional.empty());

        FeaturedKeeper keeper1 = new FeaturedKeeper();
        keeper1.setId(1L);
        keeper1.setName("Keeper 1");

        FeaturedKeeper keeper2 = new FeaturedKeeper();
        keeper2.setId(2L);
        keeper2.setName("Keeper 2");

        when(repository.findAll(any(Sort.class))).thenReturn(List.of(keeper1, keeper2));

        FeaturedKeeperResponse response = service.getFeaturedKeeperOfToday();

        assertThat(response).isNotNull();
        assertThat(response.getName()).isIn("Keeper 1", "Keeper 2");
    }

    @Test
    void getFeaturedKeeperOfToday_whenRepositoryEmpty_throwsResourceNotFoundException() {
        LocalDate today = LocalDate.now();
        when(repository.findByActiveDateAndStatus(today, "Active")).thenReturn(Optional.empty());
        when(repository.findFirstByActiveDate(today)).thenReturn(Optional.empty());
        when(repository.findAll(any(Sort.class))).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> service.getFeaturedKeeperOfToday())
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("No Knowledge Keeper found");
    }

    @Test
    void generateFromStoryId_whenStoryFound_generatesAndSavesKeeper() {
        UUID storyId = UUID.randomUUID();
        LocalDate targetDate = LocalDate.now().plusDays(2);

        ModerationQueueItem story = new ModerationQueueItem();
        story.setId(storyId);
        story.setTitle("Ancient Weaving of Dumbara");
        story.setDescription("Preserving centuries-old geometric textile weaving techniques.");
        story.setBodyContent("Detailed oral history about Dumbara weaving patterns and natural dyes.");
        story.setAuthorName("Tikiri Menike");
        story.setImageUrl("https://example.com/weaving.jpg");

        when(moderationQueueRepository.findById(storyId)).thenReturn(Optional.of(story));

        String mockGroqJson = "{\"quote\": \"Every woven thread binds us to our ancestors.\", \"title\": \"Master Weaver\", \"tag\": \"TRADITIONAL CRAFTS\"}";
        when(groqAiService.generateKnowledgeKeeper(any(), any(), any(), any())).thenReturn(mockGroqJson);

        FeaturedKeeper savedKeeper = new FeaturedKeeper();
        savedKeeper.setId(20L);
        savedKeeper.setName("Tikiri Menike");
        savedKeeper.setTitle("Master Weaver");
        savedKeeper.setQuote("Every woven thread binds us to our ancestors.");
        savedKeeper.setTag("TRADITIONAL CRAFTS");
        savedKeeper.setActiveDate(targetDate);
        savedKeeper.setLikesCount(0);

        when(repository.save(any(FeaturedKeeper.class))).thenReturn(savedKeeper);

        FeaturedKeeperResponse response = service.generateFromStoryId(storyId, targetDate);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(20L);
        assertThat(response.getName()).isEqualTo("Tikiri Menike");
        assertThat(response.getTitle()).isEqualTo("Master Weaver");
        verify(repository).save(any(FeaturedKeeper.class));
    }

    @Test
    void generateFromStoryId_whenStoryNotFound_throwsResourceNotFoundException() {
        UUID storyId = UUID.randomUUID();
        when(moderationQueueRepository.findById(storyId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.generateFromStoryId(storyId, LocalDate.now()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Story not found");
    }
}
