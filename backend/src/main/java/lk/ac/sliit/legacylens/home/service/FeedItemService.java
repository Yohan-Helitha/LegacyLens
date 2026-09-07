package lk.ac.sliit.legacylens.home.service;

import lk.ac.sliit.legacylens.home.dto.FeedItemResponse;
import lk.ac.sliit.legacylens.home.entity.AudioItem;
import lk.ac.sliit.legacylens.home.entity.BlogItem;
import lk.ac.sliit.legacylens.home.entity.FeedItem;
import lk.ac.sliit.legacylens.home.entity.VideoItem;
import lk.ac.sliit.legacylens.home.repository.FeedItemRepository;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.entity.ModerationStatus;
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

    public FeedItemService(FeedItemRepository repository, lk.ac.sliit.legacylens.home.repository.FeedItemCommentRepository commentRepository) {
    public FeedItemService(
            FeedItemRepository repository,
            lk.ac.sliit.legacylens.home.repository.FeedItemCommentRepository commentRepository,
            ModerationQueueRepository moderationQueueRepository) {
        this.repository = repository;
        this.commentRepository = commentRepository;
        this.moderationQueueRepository = moderationQueueRepository;
    }

    public List<FeedItemResponse> getAllFeedItems() {
        return repository.findAll().stream()
        List<FeedItemResponse> items = new ArrayList<>();

        try {
            List<ModerationQueueItem> publishedStories = moderationQueueRepository.findByStatus(ModerationStatus.PUBLISHED);
            for (ModerationQueueItem story : publishedStories) {
                items.add(mapStoryToFeedResponse(story));
            }
        } catch (Exception ignored) {
        }

        items.addAll(repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
                .collect(Collectors.toList()));

        return items;
    }

    private FeedItemResponse mapStoryToFeedResponse(ModerationQueueItem story) {
        FeedItemResponse res = new FeedItemResponse();
        res.setId(story.getId() != null ? story.getId().toString() : UUID.randomUUID().toString());
        res.setAuthor(story.getAuthorName());
        res.setLocation("Sri Lanka");
        res.setTags(story.getTags() != null ? Arrays.asList(story.getTags()) : List.of());
        res.setLikesCount(0);
        res.setCommentsCount(0);

        String mediaType = story.getType() != null ? story.getType().toLowerCase() : "";
        String method = story.getMethod() != null ? story.getMethod().toLowerCase() : "";

        if ("video".equals(mediaType)) {
            res.setType("video");
            res.setTitle(story.getTitle());
            res.setThumbnail(story.getImageUrl() != null && !story.getImageUrl().isBlank()
                    ? story.getImageUrl()
                    : "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600");
            res.setVideoUrl(story.getMediaFilePath() != null && !story.getMediaFilePath().isBlank()
                    ? story.getMediaFilePath()
                    : "https://www.w3schools.com/html/mov_bbb.mp4");
            res.setDuration(story.getMediaDurationMillis() != null && story.getMediaDurationMillis() > 0
                    ? (story.getMediaDurationMillis() / 60000 + " mins")
                    : "10:00");
        } else if ("audio".equals(mediaType) || "recorded".equals(method)) {
            res.setType("audio");
            res.setName(story.getTitle());
            res.setTitle(story.getTitle());
            res.setTopic(story.getDescription());
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
        return res;
    }

    public List<lk.ac.sliit.legacylens.home.dto.CommentResponse> getComments(Long feedItemId) {
        return commentRepository.findByFeedItemIdOrderByCreatedAtDesc(feedItemId).stream()
                .map(c -> lk.ac.sliit.legacylens.home.dto.CommentResponse.builder()
                        .id(String.valueOf(c.getId()))
                        .author(c.getAuthor())
                        .avatar(c.getAuthorAvatar())
                        .text(c.getText())
                        .timeAgo(c.getTimeAgo())
                        .build())
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public lk.ac.sliit.legacylens.home.dto.CommentResponse addComment(Long feedItemId, lk.ac.sliit.legacylens.home.dto.CommentRequest request) {
        FeedItem feedItem = repository.findById(feedItemId)
                .orElseThrow(() -> new lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException("Feed item not found"));

        lk.ac.sliit.legacylens.home.entity.FeedItemComment comment = new lk.ac.sliit.legacylens.home.entity.FeedItemComment();
        comment.setFeedItem(feedItem);
        comment.setAuthor("You (Demo User)");
        comment.setAuthorAvatar("https://i.pravatar.cc/150?img=1");
        comment.setText(request.getText());
        comment.setTimeAgo("Just now");
        
        feedItem.setCommentsCount(feedItem.getCommentsCount() + 1);
        repository.save(feedItem);
        
        lk.ac.sliit.legacylens.home.entity.FeedItemComment saved = commentRepository.save(comment);
        
        return lk.ac.sliit.legacylens.home.dto.CommentResponse.builder()
                .id(String.valueOf(saved.getId()))
                .author(saved.getAuthor())
                .avatar(saved.getAuthorAvatar())
                .text(saved.getText())
                .timeAgo(saved.getTimeAgo())
                .build();
    }

    @org.springframework.transaction.annotation.Transactional
    public void likePost(Long feedItemId) {
        FeedItem feedItem = repository.findById(feedItemId)
                .orElseThrow(() -> new lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException("Feed item not found"));
        feedItem.setLikesCount(feedItem.getLikesCount() + 1);
        repository.save(feedItem);
    }

    private FeedItemResponse mapToResponse(FeedItem item) {
        FeedItemResponse res = new FeedItemResponse();
        res.setId(String.valueOf(item.getId()));
        res.setAuthor(item.getAuthor());
        res.setLocation(item.getLocation());
        res.setTags(item.getTags());
        res.setLikesCount(item.getLikesCount());
        res.setCommentsCount(item.getCommentsCount());
        
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
