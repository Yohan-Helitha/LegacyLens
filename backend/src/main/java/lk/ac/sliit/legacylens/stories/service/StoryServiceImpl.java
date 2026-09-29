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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Owns story creation and retrieval — the backend side of the mobile app's
 * record → review → save flow (RecordCapture/upload → StoryDetails). Media
 * bytes are delegated to FileStorageService; this class only ever deals in
 * relative paths.
 */
@Service
public class StoryServiceImpl implements StoryService {

    /** Subfolder under the storage root that story clips are saved into. */
    private static final String MEDIA_SUBFOLDER = "stories";

    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final FileStorageService fileStorageService;

    public StoryServiceImpl(
            StoryRepository storyRepository,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            FileStorageService fileStorageService) {

        this.storyRepository = storyRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.fileStorageService = fileStorageService;
    }

    @Override
    @Transactional
    public StoryResponse create(UUID userId, CreateStoryRequest request) {
        User author = getUser(userId);
        requireElderRole(userId);

        MultipartFile media = request.getMedia();
        boolean expectsMedia = request.getMethod() != StoryMethod.WRITTEN;

        if (expectsMedia && (media == null || media.isEmpty())) {
            throw new InvalidRequestException("A media clip is required for this capture method");
        }

        Story story = new Story();
        story.setAuthor(author);
        story.setTitle(request.getTitle());
        story.setDescription(request.getDescription());
        story.setMethod(request.getMethod());
        story.setStatus(StoryStatus.PENDING);

        if (media != null && !media.isEmpty()) {
            attachMedia(story, media, request.getMediaDurationMillis());
        }

        storyRepository.save(story);

        return toResponse(story);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StoryResponse> listMine(UUID userId) {
        return storyRepository.findByAuthorIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public StoryResponse getById(UUID userId, UUID storyId) {
        return toResponse(getOwnedStory(userId, storyId));
    }

    @Override
    @Transactional
    public StoryResponse update(UUID userId, UUID storyId, UpdateStoryRequest request) {
        Story story = getOwnedStory(userId, storyId);

        story.setTitle(request.getTitle());
        story.setDescription(request.getDescription());
        storyRepository.save(story);

        return toResponse(story);
    }

    @Override
    @Transactional
    public void delete(UUID userId, UUID storyId) {
        Story story = getOwnedStory(userId, storyId);

        if (story.getMediaFilePath() != null) {
            fileStorageService.delete(story.getMediaFilePath());
        }

        storyRepository.delete(story);
    }

    private void attachMedia(Story story, MultipartFile media, Long durationMillis) {
        MediaType mediaType = resolveMediaType(media.getContentType());
        String relativePath = fileStorageService.store(media, MEDIA_SUBFOLDER);

        story.setMediaType(mediaType);
        story.setMediaFilePath(relativePath);
        story.setMediaMimeType(media.getContentType());
        story.setMediaFileSizeBytes(media.getSize());
        story.setMediaDurationMillis(durationMillis);
    }

    private Story getOwnedStory(UUID userId, UUID storyId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("Story not found"));

        if (!story.getAuthor().getId().equals(userId)) {
            // Same message/status as "doesn't exist" — don't reveal other users' story ids.
            throw new ResourceNotFoundException("Story not found");
        }

        return story;
    }

    private void requireElderRole(UUID userId) {
        if (!userRoleRepository.existsByUserIdAndRoleType(userId, RoleType.ELDER)) {
            throw new ForbiddenOperationException("Only storytellers can create stories");
        }
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private MediaType resolveMediaType(String contentType) {
        if (contentType != null && contentType.startsWith("audio/")) {
            return MediaType.AUDIO;
        }
        if (contentType != null && contentType.startsWith("video/")) {
            return MediaType.VIDEO;
        }
        throw new InvalidRequestException("Unsupported media type: " + contentType);
    }

    private StoryResponse toResponse(Story story) {
        String mediaUrl = story.getMediaFilePath() != null
                ? "/uploads/" + story.getMediaFilePath()
                : null;

        return StoryResponse.builder()
                .id(story.getId())
                .title(story.getTitle())
                .description(story.getDescription())
                .status(story.getStatus().name())
                .method(story.getMethod().name())
                .mediaType(story.getMediaType() != null ? story.getMediaType().name() : null)
                .mediaUrl(mediaUrl)
                .mediaDurationMillis(story.getMediaDurationMillis())
                .createdAt(story.getCreatedAt())
                .updatedAt(story.getUpdatedAt())
                .publishedAt(story.getPublishedAt())
                .build();
    }
}
