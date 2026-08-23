package lk.ac.sliit.legacylens.home.service;

import lk.ac.sliit.legacylens.home.dto.FeedItemResponse;
import lk.ac.sliit.legacylens.home.entity.AudioItem;
import lk.ac.sliit.legacylens.home.entity.BlogItem;
import lk.ac.sliit.legacylens.home.entity.FeedItem;
import lk.ac.sliit.legacylens.home.entity.VideoItem;
import lk.ac.sliit.legacylens.home.repository.FeedItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeedItemService {

    private final FeedItemRepository repository;
    private final lk.ac.sliit.legacylens.home.repository.FeedItemCommentRepository commentRepository;

    public FeedItemService(FeedItemRepository repository, lk.ac.sliit.legacylens.home.repository.FeedItemCommentRepository commentRepository) {
        this.repository = repository;
        this.commentRepository = commentRepository;
    }

    public List<FeedItemResponse> getAllFeedItems() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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
