package lk.ac.sliit.legacylens.home.service;

import lk.ac.sliit.legacylens.home.dto.FeedItemResponse;
import lk.ac.sliit.legacylens.home.entity.AudioItem;
import lk.ac.sliit.legacylens.home.entity.BlogItem;
import lk.ac.sliit.legacylens.home.entity.FeedItem;
import lk.ac.sliit.legacylens.home.entity.VideoItem;
import lk.ac.sliit.legacylens.home.repository.FeedItemRepository;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FeedItemService {

    private final FeedItemRepository repository;
    private final lk.ac.sliit.legacylens.home.repository.FeedItemCommentRepository commentRepository;
    private final ModerationQueueRepository moderationQueueRepository;

    public FeedItemService(
            FeedItemRepository repository,
            lk.ac.sliit.legacylens.home.repository.FeedItemCommentRepository commentRepository,
            ModerationQueueRepository moderationQueueRepository) {
        this.repository = repository;
        this.commentRepository = commentRepository;
        this.moderationQueueRepository = moderationQueueRepository;
    }

    public List<FeedItemResponse> getAllFeedItems() {
        List<FeedItemResponse> items = new ArrayList<>();

        try {
            List<ModerationQueueItem> publishedStories = moderationQueueRepository
                    .findByStatus(StoryStatus.PUBLISHED);
            for (ModerationQueueItem story : publishedStories) {
                items.add(mapStoryToFeedResponse(story));
            }
        } catch (Exception ignored) {
        }

        items.addAll(repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList()));

        return items;
    }

    private FeedItemResponse mapStoryToFeedResponse(ModerationQueueItem story) {
        FeedItemResponse res = new FeedItemResponse();
        res.setId(story.getId() != null ? story.getId().toString() : UUID.randomUUID().toString());
        res.setAuthor(story.getAuthorName());
        res.setLocation("Sri Lanka");
        res.setTags(story.getTags() != null ? Arrays.asList(story.getTags()) : List.of());
        res.setLikesCount(story.getLikesCount() != null ? story.getLikesCount() : 0);
        long realComments = story.getId() != null ? commentRepository.countByStoryId(story.getId()) : 0;
        res.setCommentsCount((int) Math.max(realComments, story.getCommentsCount() != null ? story.getCommentsCount() : 0));

        String mediaType = story.getType() != null ? story.getType().toLowerCase() : "";
        String method = story.getMethod() != null ? story.getMethod().toLowerCase() : "";

        String mediaPath = story.getMediaFilePath();
        if (mediaPath != null && !mediaPath.isBlank() && !mediaPath.startsWith("http")) {
            mediaPath = "/uploads/" + (mediaPath.startsWith("/") ? mediaPath.substring(1) : mediaPath);
        }

        if ("video".equals(mediaType)) {
            res.setType("video");
            res.setTitle(story.getTitle());
            res.setThumbnail(story.getImageUrl() != null && !story.getImageUrl().isBlank()
                    ? story.getImageUrl()
                    : "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600");
            res.setVideoUrl(mediaPath != null && !mediaPath.isBlank()
                    ? mediaPath
                    : "https://www.w3schools.com/html/mov_bbb.mp4");
            res.setDuration(story.getMediaDurationMillis() != null && story.getMediaDurationMillis() > 0
                    ? (story.getMediaDurationMillis() / 60000 + " mins")
                    : "10:00");
        } else if ("audio".equals(mediaType) || "recorded".equals(method)) {
            res.setType("audio");
            res.setName(story.getTitle());
            res.setTitle(story.getTitle());
            res.setTopic(story.getDescription());
            res.setMediaUrl(mediaPath);
            res.setAvatar(story.getImageUrl() != null && !story.getImageUrl().isBlank()
                    ? story.getImageUrl()
                    : "https://i.pravatar.cc/150?img=1");
            res.setDuration(story.getMediaDurationMillis() != null && story.getMediaDurationMillis() > 0
                    ? (story.getMediaDurationMillis() / 60000 + " mins")
                    : "12 mins");
            res.setBars(List.of(2, 4, 3, 5, 2, 6, 4, 2, 3, 5, 2));
        } else {
            res.setType("blog");
            res.setTitle(story.getTitle());
            res.setThumbnail(story.getImageUrl() != null && !story.getImageUrl().isBlank()
                    ? story.getImageUrl()
                    : "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=600");
            res.setExcerpt(story.getDescription());
            res.setReadTime("5 min");
        }
        res.setDescription(story.getDescription());
        res.setContent(story.getBodyContent() != null ? story.getBodyContent() : story.getDescription());
        res.setCategory(story.getTags() != null && story.getTags().length > 0 ? story.getTags()[0] : "Heritage");
        return res;
    }

    private FeedItem findFeedItem(String id) {
        if (id == null || id.isBlank()) return null;
        try {
            Long numericId = Long.parseLong(id);
            return repository.findById(numericId).orElse(null);
        } catch (NumberFormatException e) {
            try {
                UUID syntheticUuid = UUID.fromString(id);
                for (FeedItem fi : repository.findAll()) {
                    if (UUID.nameUUIDFromBytes(("feed_item_" + fi.getId()).getBytes()).equals(syntheticUuid)) {
                        return fi;
                    }
                }
            } catch (IllegalArgumentException ignored) {
            }
            return null;
        }
    }

    public List<lk.ac.sliit.legacylens.home.dto.CommentResponse> getComments(String id) {
        try {
            UUID storyUuid = UUID.fromString(id);
            var storyComments = commentRepository.findByStoryIdOrderByCreatedAtDesc(storyUuid);
            if (!storyComments.isEmpty() || moderationQueueRepository.existsById(storyUuid)) {
                return storyComments.stream()
                        .map(this::mapCommentToResponse)
                        .collect(Collectors.toList());
            }
        } catch (IllegalArgumentException ignored) {
        }

        FeedItem fi = findFeedItem(id);
        if (fi != null) {
            return commentRepository.findByFeedItemIdOrderByCreatedAtDesc(fi.getId()).stream()
                    .map(this::mapCommentToResponse)
                    .collect(Collectors.toList());
        }

        return List.of();
    }

    @org.springframework.transaction.annotation.Transactional
    public lk.ac.sliit.legacylens.home.dto.CommentResponse addComment(String id,
            lk.ac.sliit.legacylens.home.dto.CommentRequest request) {
        lk.ac.sliit.legacylens.home.entity.FeedItemComment comment = new lk.ac.sliit.legacylens.home.entity.FeedItemComment();
        
        String author = (request.getAuthor() != null && !request.getAuthor().trim().isEmpty())
                ? request.getAuthor().trim()
                : "You (Community Learner)";
        String avatar = (request.getAvatar() != null && !request.getAvatar().trim().isEmpty())
                ? request.getAvatar().trim()
                : "https://i.pravatar.cc/150?img=1";

        comment.setAuthor(author);
        comment.setAuthorAvatar(avatar);
        comment.setUserId(request.getUserId());
        comment.setText(request.getText() != null ? request.getText().trim() : "");
        comment.setTimeAgo("Just now");
        comment.setCreatedAt(java.time.LocalDateTime.now());

        UUID storyUuid = null;
        FeedItem feedItem = null;

        try {
            UUID parsedUuid = UUID.fromString(id);
            if (moderationQueueRepository.existsById(parsedUuid)) {
                storyUuid = parsedUuid;
                comment.setStoryId(storyUuid);
            }
        } catch (IllegalArgumentException ignored) {
        }

        if (storyUuid == null) {
            feedItem = findFeedItem(id);
            if (feedItem != null) {
                comment.setFeedItem(feedItem);
            } else {
                throw new lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException("Post not found with id: " + id);
            }
        }

        lk.ac.sliit.legacylens.home.entity.FeedItemComment saved = commentRepository.save(comment);

        // Keep commentsCount synchronized with exact count in DB
        if (storyUuid != null) {
            final UUID finalStoryUuid = storyUuid;
            moderationQueueRepository.findById(finalStoryUuid).ifPresent(story -> {
                long count = commentRepository.countByStoryId(finalStoryUuid);
                story.setCommentsCount((int) count);
                moderationQueueRepository.save(story);
            });
        } else if (feedItem != null) {
            final Long finalFeedItemId = feedItem.getId();
            repository.findById(finalFeedItemId).ifPresent(fi -> {
                long count = commentRepository.countByFeedItemId(finalFeedItemId);
                fi.setCommentsCount((int) count);
                repository.save(fi);
            });
        }

        return mapCommentToResponse(saved);
    }

    @org.springframework.transaction.annotation.Transactional
    public lk.ac.sliit.legacylens.home.dto.CommentResponse updateComment(Long commentId,
            lk.ac.sliit.legacylens.home.dto.CommentRequest request) {
        lk.ac.sliit.legacylens.home.entity.FeedItemComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException(
                        "Comment not found with id: " + commentId));

        if (request.getText() != null && !request.getText().trim().isEmpty()) {
            comment.setText(request.getText().trim());
        }
        comment.setUpdatedAt(java.time.LocalDateTime.now());

        lk.ac.sliit.legacylens.home.entity.FeedItemComment saved = commentRepository.save(comment);
        return mapCommentToResponse(saved);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteComment(Long commentId) {
        lk.ac.sliit.legacylens.home.entity.FeedItemComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException(
                        "Comment not found with id: " + commentId));

        UUID storyId = comment.getStoryId();
        FeedItem feedItem = comment.getFeedItem();
        Long feedItemId = feedItem != null ? feedItem.getId() : null;

        commentRepository.delete(comment);

        // Update exact count in parent story or feed item
        if (storyId != null) {
            moderationQueueRepository.findById(storyId).ifPresent(story -> {
                long count = commentRepository.countByStoryId(storyId);
                story.setCommentsCount((int) count);
                moderationQueueRepository.save(story);
            });
        } else if (feedItemId != null) {
            repository.findById(feedItemId).ifPresent(fi -> {
                long count = commentRepository.countByFeedItemId(feedItemId);
                fi.setCommentsCount((int) count);
                repository.save(fi);
            });
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public int likePost(String id) {
        // 1. Try finding in ModerationQueueItem by UUID
        try {
            UUID storyUuid = UUID.fromString(id);
            var optStory = moderationQueueRepository.findById(storyUuid);
            if (optStory.isPresent()) {
                ModerationQueueItem story = optStory.get();
                int newCount = (story.getLikesCount() != null ? story.getLikesCount() : 0) + 1;
                story.setLikesCount(newCount);
                moderationQueueRepository.save(story);
                return newCount;
            }
        } catch (IllegalArgumentException ignored) {
        }

        // 2. Try finding in FeedItem by numeric ID or by synthetic UUID
        FeedItem feedItem = findFeedItem(id);
        if (feedItem != null) {
            int newCount = (feedItem.getLikesCount() != null ? feedItem.getLikesCount() : 0) + 1;
            feedItem.setLikesCount(newCount);
            repository.save(feedItem);
            return newCount;
        }

        throw new lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException("Content not found with id: " + id);
    }

    @org.springframework.transaction.annotation.Transactional
    public int unlikePost(String id) {
        try {
            UUID storyUuid = UUID.fromString(id);
            var optStory = moderationQueueRepository.findById(storyUuid);
            if (optStory.isPresent()) {
                ModerationQueueItem story = optStory.get();
                int current = story.getLikesCount() != null ? story.getLikesCount() : 0;
                int newCount = Math.max(0, current - 1);
                story.setLikesCount(newCount);
                moderationQueueRepository.save(story);
                return newCount;
            }
        } catch (IllegalArgumentException ignored) {
        }

        FeedItem feedItem = findFeedItem(id);
        if (feedItem != null) {
            int current = feedItem.getLikesCount() != null ? feedItem.getLikesCount() : 0;
            int newCount = Math.max(0, current - 1);
            feedItem.setLikesCount(newCount);
            repository.save(feedItem);
            return newCount;
        }

        throw new lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException("Content not found with id: " + id);
    }

    public int getLikesCount(String id) {
        try {
            UUID storyUuid = UUID.fromString(id);
            var optStory = moderationQueueRepository.findById(storyUuid);
            if (optStory.isPresent()) {
                return optStory.get().getLikesCount() != null ? optStory.get().getLikesCount() : 0;
            }
        } catch (IllegalArgumentException ignored) {
        }

        FeedItem feedItem = findFeedItem(id);
        if (feedItem != null) {
            return feedItem.getLikesCount() != null ? feedItem.getLikesCount() : 0;
        }

        return 0;
    }

    private lk.ac.sliit.legacylens.home.dto.CommentResponse mapCommentToResponse(
            lk.ac.sliit.legacylens.home.entity.FeedItemComment c) {
        return lk.ac.sliit.legacylens.home.dto.CommentResponse.builder()
                .id(String.valueOf(c.getId()))
                .author(c.getAuthor())
                .avatar(c.getAuthorAvatar())
                .text(c.getText())
                .timeAgo(formatTimeAgo(c.getCreatedAt(), c.getTimeAgo()))
                .userId(c.getUserId())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private String formatTimeAgo(java.time.LocalDateTime createdAt, String storedTimeAgo) {
        if (createdAt == null) {
            return (storedTimeAgo != null && !storedTimeAgo.isBlank()) ? storedTimeAgo : "Just now";
        }
        java.time.Duration diff = java.time.Duration.between(createdAt, java.time.LocalDateTime.now());
        long seconds = Math.abs(diff.getSeconds());
        if (seconds < 60) {
            return "Just now";
        }
        long minutes = diff.toMinutes();
        if (minutes < 60) {
            return minutes + "m ago";
        }
        long hours = diff.toHours();
        if (hours < 24) {
            return hours + "h ago";
        }
        long days = diff.toDays();
        if (days < 7) {
            return days + "d ago";
        }
        if (days < 30) {
            return (days / 7) + "w ago";
        }
        return (days / 30) + "mo ago";
    }

    private FeedItemResponse mapToResponse(FeedItem item) {
        FeedItemResponse res = new FeedItemResponse();
        res.setId(String.valueOf(item.getId()));
        res.setAuthor(item.getAuthor());
        res.setLocation(item.getLocation());
        res.setTags(item.getTags());
        res.setLikesCount(item.getLikesCount());
        long realItemComments = commentRepository.countByFeedItemId(item.getId());
        res.setCommentsCount((int) Math.max(realItemComments, item.getCommentsCount() != null ? item.getCommentsCount() : 0));

        if (item instanceof VideoItem) {
            VideoItem vi = (VideoItem) item;
            res.setType("video");
            res.setTitle(vi.getTitle());
            res.setThumbnail(vi.getThumbnail());
            res.setVideoUrl(vi.getVideoUrl());
            res.setDuration(vi.getDuration());
        } else if (item instanceof BlogItem) {
            BlogItem bi = (BlogItem) item;
            res.setType("blog");
            res.setTitle(bi.getTitle());
            res.setThumbnail(bi.getThumbnail());
            res.setExcerpt(bi.getExcerpt());
            res.setReadTime(bi.getReadTime());
        } else if (item instanceof AudioItem) {
            AudioItem ai = (AudioItem) item;
            res.setType("audio");
            res.setName(ai.getTitle()); // Map DB title to DTO name for audio
            res.setDuration(ai.getDuration());
            res.setTopic(ai.getTopic());
            res.setAvatar(ai.getAvatar());
            res.setBars(ai.getBars());
        }

        return res;
    }
}
