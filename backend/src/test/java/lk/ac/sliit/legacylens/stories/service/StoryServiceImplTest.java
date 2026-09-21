package lk.ac.sliit.legacylens.stories.service;

import lk.ac.sliit.legacylens.common.exception.ForbiddenOperationException;
import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.stories.dto.CreateStoryRequest;
import lk.ac.sliit.legacylens.stories.dto.StoryResponse;
import lk.ac.sliit.legacylens.stories.dto.UpdateStoryRequest;
import lk.ac.sliit.legacylens.stories.entity.MediaType;
import lk.ac.sliit.legacylens.stories.entity.Story;
import lk.ac.sliit.legacylens.stories.entity.StoryMethod;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.stories.repository.StoryRepository;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import lk.ac.sliit.legacylens.users.repository.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoryServiceImplTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID OTHER_USER_ID = UUID.randomUUID();
    private static final UUID STORY_ID = UUID.randomUUID();

    @Mock
    private StoryRepository storyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private FileStorageService fileStorageService;

    private StoryServiceImpl storyService;

    @BeforeEach
    void setUp() {
        storyService = new StoryServiceImpl(storyRepository, userRepository, userRoleRepository, fileStorageService);
    }

    private User buildUser(UUID id) {
        User user = new User();
        user.setId(id);
        user.setFullName("Kasun Perera");
        user.setPhoneNumber("+94771234567");
        user.setNicNumber("199812345678");
        user.setDateOfBirth(LocalDate.of(1998, 4, 12));
        return user;
    }

    private CreateStoryRequest buildRequest(StoryMethod method, org.springframework.web.multipart.MultipartFile media) {
        CreateStoryRequest request = new CreateStoryRequest();
        request.setTitle("The Monsoon of '78");
        request.setDescription("A story about the great monsoon");
        request.setMethod(method);
        request.setMediaDurationMillis(45_000L);
        request.setMedia(media);
        return request;
    }

    private Story buildStory(User author) {
        Story story = new Story();
        story.setId(STORY_ID);
        story.setAuthor(author);
        story.setTitle("Family Recipes");
        story.setStatus(StoryStatus.PENDING);
        story.setMethod(StoryMethod.RECORDED);
        story.setMediaType(MediaType.AUDIO);
        story.setMediaFilePath("stories/existing.m4a");
        return story;
    }

    // ── create ────────────────────────────────────────────────────────────

    @Test
    void create_notElder_throwsForbiddenAndNeverTouchesStorage() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(USER_ID)));
        when(userRoleRepository.existsByUserIdAndRoleType(USER_ID, RoleType.ELDER)).thenReturn(false);

        MockMultipartFile media = new MockMultipartFile("media", "a.m4a", "audio/m4a", "x".getBytes());
        CreateStoryRequest request = buildRequest(StoryMethod.RECORDED, media);

        assertThrows(ForbiddenOperationException.class, () -> storyService.create(USER_ID, request));

        verify(fileStorageService, never()).store(any(), anyString());
        verify(storyRepository, never()).save(any());
    }

    @Test
    void create_recordedMethodWithoutMedia_throwsInvalidRequest() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(USER_ID)));
        when(userRoleRepository.existsByUserIdAndRoleType(USER_ID, RoleType.ELDER)).thenReturn(true);

        CreateStoryRequest request = buildRequest(StoryMethod.RECORDED, null);

        assertThrows(InvalidRequestException.class, () -> storyService.create(USER_ID, request));

        verify(storyRepository, never()).save(any());
    }

    @Test
    void create_audioClip_storesFileAndResolvesAudioMediaType() {
        User author = buildUser(USER_ID);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(author));
        when(userRoleRepository.existsByUserIdAndRoleType(USER_ID, RoleType.ELDER)).thenReturn(true);
        when(fileStorageService.store(any(), eq("stories"))).thenReturn("stories/generated-name.m4a");

        MockMultipartFile media = new MockMultipartFile("media", "voice.m4a", "audio/m4a", "hello".getBytes());
        CreateStoryRequest request = buildRequest(StoryMethod.RECORDED, media);

        StoryResponse response = storyService.create(USER_ID, request);

        ArgumentCaptor<Story> storyCaptor = ArgumentCaptor.forClass(Story.class);
        verify(storyRepository).save(storyCaptor.capture());
        Story saved = storyCaptor.getValue();

        assertThat(saved.getAuthor()).isEqualTo(author);
        assertThat(saved.getTitle()).isEqualTo("The Monsoon of '78");
        assertThat(saved.getStatus()).isEqualTo(StoryStatus.PENDING);
        assertThat(saved.getMediaType()).isEqualTo(MediaType.AUDIO);
        assertThat(saved.getMediaFilePath()).isEqualTo("stories/generated-name.m4a");
        assertThat(saved.getMediaDurationMillis()).isEqualTo(45_000L);

        assertThat(response.getMediaUrl()).isEqualTo("/uploads/stories/generated-name.m4a");
        assertThat(response.getMediaType()).isEqualTo("AUDIO");
    }

    @Test
    void create_videoClip_resolvesVideoMediaType() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(USER_ID)));
        when(userRoleRepository.existsByUserIdAndRoleType(USER_ID, RoleType.ELDER)).thenReturn(true);
        when(fileStorageService.store(any(), eq("stories"))).thenReturn("stories/clip.mp4");

        MockMultipartFile media = new MockMultipartFile("media", "clip.mp4", "video/mp4", "x".getBytes());
        CreateStoryRequest request = buildRequest(StoryMethod.UPLOADED, media);

        StoryResponse response = storyService.create(USER_ID, request);

        assertThat(response.getMediaType()).isEqualTo("VIDEO");
    }

    @Test
    void create_unsupportedContentType_throwsInvalidRequestAndNeverStores() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(USER_ID)));
        when(userRoleRepository.existsByUserIdAndRoleType(USER_ID, RoleType.ELDER)).thenReturn(true);

        MockMultipartFile media = new MockMultipartFile("media", "doc.pdf", "application/pdf", "x".getBytes());
        CreateStoryRequest request = buildRequest(StoryMethod.UPLOADED, media);

        assertThrows(InvalidRequestException.class, () -> storyService.create(USER_ID, request));

        verify(fileStorageService, never()).store(any(), anyString());
        verify(storyRepository, never()).save(any());
    }

    @Test
    void create_writtenMethodWithNoMedia_savesStoryWithoutMediaFields() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser(USER_ID)));
        when(userRoleRepository.existsByUserIdAndRoleType(USER_ID, RoleType.ELDER)).thenReturn(true);

        CreateStoryRequest request = buildRequest(StoryMethod.WRITTEN, null);

        StoryResponse response = storyService.create(USER_ID, request);

        verify(fileStorageService, never()).store(any(), anyString());
        assertThat(response.getMediaUrl()).isNull();
        assertThat(response.getMediaType()).isNull();
    }

    @Test
    void create_userNotFound_throwsResourceNotFound() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        CreateStoryRequest request = buildRequest(StoryMethod.WRITTEN, null);

        assertThrows(ResourceNotFoundException.class, () -> storyService.create(USER_ID, request));
    }

    // ── listMine ──────────────────────────────────────────────────────────

    @Test
    void listMine_mapsRepositoryResultsToResponses_newestFirst() {
        User author = buildUser(USER_ID);
        Story story = buildStory(author);
        when(storyRepository.findByAuthorIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(story));

        List<StoryResponse> results = storyService.listMine(USER_ID);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo(STORY_ID);
        assertThat(results.get(0).getMediaUrl()).isEqualTo("/uploads/stories/existing.m4a");
    }

    // ── getById ───────────────────────────────────────────────────────────

    @Test
    void getById_owner_returnsStory() {
        User author = buildUser(USER_ID);
        Story story = buildStory(author);
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.of(story));

        StoryResponse response = storyService.getById(USER_ID, STORY_ID);

        assertThat(response.getId()).isEqualTo(STORY_ID);
    }

    @Test
    void getById_notOwner_throwsResourceNotFound() {
        User author = buildUser(USER_ID);
        Story story = buildStory(author);
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.of(story));

        assertThrows(ResourceNotFoundException.class, () -> storyService.getById(OTHER_USER_ID, STORY_ID));
    }

    @Test
    void getById_doesNotExist_throwsResourceNotFound() {
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> storyService.getById(USER_ID, STORY_ID));
    }

    // ── update ────────────────────────────────────────────────────────────

    @Test
    void update_owner_updatesTitleAndDescriptionAndPersists() {
        User author = buildUser(USER_ID);
        Story story = buildStory(author);
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.of(story));

        UpdateStoryRequest request = new UpdateStoryRequest();
        request.setTitle("Family Recipes (revised)");
        request.setDescription("Updated with grandma's missing step");

        StoryResponse response = storyService.update(USER_ID, STORY_ID, request);

        verify(storyRepository).save(story);
        assertThat(story.getTitle()).isEqualTo("Family Recipes (revised)");
        assertThat(story.getDescription()).isEqualTo("Updated with grandma's missing step");
        assertThat(response.getTitle()).isEqualTo("Family Recipes (revised)");
        assertThat(response.getDescription()).isEqualTo("Updated with grandma's missing step");
    }

    @Test
    void update_notOwner_throwsResourceNotFoundAndNeverSaves() {
        User author = buildUser(USER_ID);
        Story story = buildStory(author);
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.of(story));

        UpdateStoryRequest request = new UpdateStoryRequest();
        request.setTitle("Hijacked title");

        assertThrows(ResourceNotFoundException.class, () -> storyService.update(OTHER_USER_ID, STORY_ID, request));

        verify(storyRepository, never()).save(any());
    }

    @Test
    void update_doesNotExist_throwsResourceNotFound() {
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.empty());

        UpdateStoryRequest request = new UpdateStoryRequest();
        request.setTitle("Doesn't matter");

        assertThrows(ResourceNotFoundException.class, () -> storyService.update(USER_ID, STORY_ID, request));
    }

    // ── delete ────────────────────────────────────────────────────────────

    @Test
    void delete_owner_deletesMediaFileAndRow() {
        User author = buildUser(USER_ID);
        Story story = buildStory(author);
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.of(story));

        storyService.delete(USER_ID, STORY_ID);

        verify(fileStorageService).delete("stories/existing.m4a");
        verify(storyRepository).delete(story);
    }

    @Test
    void delete_storyWithNoMedia_skipsFileDeletion() {
        User author = buildUser(USER_ID);
        Story story = buildStory(author);
        story.setMediaFilePath(null);
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.of(story));

        storyService.delete(USER_ID, STORY_ID);

        verify(fileStorageService, never()).delete(anyString());
        verify(storyRepository).delete(story);
    }

    @Test
    void delete_notOwner_throwsResourceNotFoundAndNeverDeletesAnything() {
        User author = buildUser(USER_ID);
        Story story = buildStory(author);
        when(storyRepository.findById(STORY_ID)).thenReturn(Optional.of(story));

        assertThrows(ResourceNotFoundException.class, () -> storyService.delete(OTHER_USER_ID, STORY_ID));

        verify(fileStorageService, never()).delete(anyString());
        verify(storyRepository, never()).delete(any());
    }
}
