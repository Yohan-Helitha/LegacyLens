package lk.ac.sliit.legacylens.home.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.home.dto.CommentRequest;
import lk.ac.sliit.legacylens.home.dto.CommentResponse;
import lk.ac.sliit.legacylens.home.dto.FeedItemResponse;
import lk.ac.sliit.legacylens.home.entity.BlogItem;
import lk.ac.sliit.legacylens.home.entity.FeedItemComment;
import lk.ac.sliit.legacylens.home.entity.PostLike;
import lk.ac.sliit.legacylens.home.repository.FeedItemCommentRepository;
import lk.ac.sliit.legacylens.home.repository.FeedItemRepository;
import lk.ac.sliit.legacylens.home.repository.PostLikeRepository;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeedItemServiceTest {

    @Mock
    private FeedItemRepository repository;

    @Mock
    private FeedItemCommentRepository commentRepository;

    @Mock
    private ModerationQueueRepository moderationQueueRepository;

    @Mock
    private PostLikeRepository postLikeRepository;

    private FeedItemService service;

    @BeforeEach
    void setUp() {
        service = new FeedItemService(repository, commentRepository, moderationQueueRepository, postLikeRepository);
    }

    @Test
    void getAllFeedItems_mapsBlogVideoAudioCorrectlyAndMarksLiked() {
        UUID blogId = UUID.randomUUID();
        UUID audioId = UUID.randomUUID();
        UUID videoId = UUID.randomUUID();

        ModerationQueueItem blogStory = new ModerationQueueItem();
        blogStory.setId(blogId);
        blogStory.setTitle("Traditional Pottery in Kelaniya");
        blogStory.setDescription("The art of moulding clay");
        blogStory.setType("blog");
        blogStory.setAuthorName("Elder Storyteller");
        blogStory.setDistrict("Gampaha");
        blogStory.setRegion("Western");
        blogStory.setTags(new String[]{"Pottery", "Craft"});
        blogStory.setLikesCount(10);

        ModerationQueueItem audioStory = new ModerationQueueItem();
        audioStory.setId(audioId);
        audioStory.setTitle("Harvest Chants of Rajarata");
        audioStory.setType("audio");
        audioStory.setMediaFilePath("/uploads/chant.mp3");
        audioStory.setMediaDurationMillis(120000L);

        ModerationQueueItem videoStory = new ModerationQueueItem();
        videoStory.setId(videoId);
        videoStory.setTitle("Kandyan Dance Ritual");
        videoStory.setType("video");
        videoStory.setMediaFilePath("/uploads/dance.mp4");
        videoStory.setMediaDurationMillis(180000L);

        when(moderationQueueRepository.findByStatus(StoryStatus.PUBLISHED))
                .thenReturn(List.of(blogStory, audioStory, videoStory));

        PostLike like = new PostLike();
        like.setPostId(blogId.toString());
        like.setUserIdentifier("user-123");
        when(postLikeRepository.findByUserIdentifier("user-123")).thenReturn(List.of(like));

        List<FeedItemResponse> feed = service.getAllFeedItems("user-123");

        assertThat(feed).hasSize(3);

        FeedItemResponse blogResp = feed.get(0);
        assertThat(blogResp.getId()).isEqualTo(blogId.toString());
        assertThat(blogResp.getType()).isEqualTo("blog");
        assertThat(blogResp.getLiked()).isTrue();
        assertThat(blogResp.getLocation()).isEqualTo("Gampaha, Western");

        FeedItemResponse audioResp = feed.get(1);
        assertThat(audioResp.getType()).isEqualTo("audio");
        assertThat(audioResp.getLiked()).isFalse();
        assertThat(audioResp.getDuration()).isEqualTo("2:00");

        FeedItemResponse videoResp = feed.get(2);
        assertThat(videoResp.getType()).isEqualTo("video");
        assertThat(videoResp.getDuration()).isEqualTo("3:00");
    }

    @Test
    void getComments_whenStoryCommentsExist_returnsSortedList() {
        UUID storyId = UUID.randomUUID();

        FeedItemComment comment = new FeedItemComment();
        comment.setId(1L);
        comment.setStoryId(storyId);
        comment.setAuthor("Kamal");
        comment.setText("Wonderful preservation of our roots!");
        comment.setCreatedAt(LocalDateTime.now().minusMinutes(5));

        when(commentRepository.findByStoryIdOrderByCreatedAtDesc(storyId)).thenReturn(List.of(comment));

        List<CommentResponse> comments = service.getComments(storyId.toString());

        assertThat(comments).hasSize(1);
        assertThat(comments.get(0).getAuthor()).isEqualTo("Kamal");
        assertThat(comments.get(0).getText()).isEqualTo("Wonderful preservation of our roots!");
    }

    @Test
    void getComments_whenPostNotFound_returnsEmptyList() {
        UUID unknownId = UUID.randomUUID();
        when(commentRepository.findByStoryIdOrderByCreatedAtDesc(unknownId)).thenReturn(Collections.emptyList());
        when(moderationQueueRepository.existsById(unknownId)).thenReturn(false);

        List<CommentResponse> comments = service.getComments(unknownId.toString());

        assertThat(comments).isEmpty();
    }

    @Test
    void addComment_toStory_savesCommentAndUpdatesCommentsCount() {
        UUID storyId = UUID.randomUUID();
        CommentRequest request = new CommentRequest();
        request.setAuthor("Sunil");
        request.setText("Inspirational cultural story.");
        request.setUserId("user-456");

        when(moderationQueueRepository.existsById(storyId)).thenReturn(true);

        FeedItemComment savedComment = new FeedItemComment();
        savedComment.setId(5L);
        savedComment.setStoryId(storyId);
        savedComment.setAuthor("Sunil");
        savedComment.setText("Inspirational cultural story.");
        savedComment.setCreatedAt(LocalDateTime.now());

        when(commentRepository.save(any(FeedItemComment.class))).thenReturn(savedComment);

        ModerationQueueItem story = new ModerationQueueItem();
        story.setId(storyId);
        story.setCommentsCount(2);

        when(moderationQueueRepository.findById(storyId)).thenReturn(Optional.of(story));
        when(commentRepository.countByStoryId(storyId)).thenReturn(3L);

        CommentResponse response = service.addComment(storyId.toString(), request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("5");
        assertThat(response.getText()).isEqualTo("Inspirational cultural story.");
        assertThat(story.getCommentsCount()).isEqualTo(3);
        verify(moderationQueueRepository).save(story);
    }

    @Test
    void addComment_whenContentNotFound_throwsResourceNotFoundException() {
        UUID nonExistentId = UUID.randomUUID();
        when(moderationQueueRepository.existsById(nonExistentId)).thenReturn(false);

        CommentRequest request = new CommentRequest();
        request.setText("Some comment");

        assertThatThrownBy(() -> service.addComment(nonExistentId.toString(), request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Post not found");
    }

    @Test
    void likePost_onStory_incrementsLikesAndSavesPostLike() {
        UUID storyId = UUID.randomUUID();
        ModerationQueueItem story = new ModerationQueueItem();
        story.setId(storyId);
        story.setLikesCount(10);

        when(moderationQueueRepository.findById(storyId)).thenReturn(Optional.of(story));

        int newCount = service.likePost(storyId.toString(), "user-1");

        assertThat(newCount).isEqualTo(11);
        assertThat(story.getLikesCount()).isEqualTo(11);
        verify(moderationQueueRepository).save(story);

        ArgumentCaptor<PostLike> captor = ArgumentCaptor.forClass(PostLike.class);
        verify(postLikeRepository).save(captor.capture());
        assertThat(captor.getValue().getUserIdentifier()).isEqualTo("user-1");
        assertThat(captor.getValue().getPostId()).isEqualTo(storyId.toString());
    }

    @Test
    void unlikePost_onStory_decrementsLikesAndDeletesPostLike() {
        UUID storyId = UUID.randomUUID();
        ModerationQueueItem story = new ModerationQueueItem();
        story.setId(storyId);
        story.setLikesCount(5);

        when(moderationQueueRepository.findById(storyId)).thenReturn(Optional.of(story));

        int newCount = service.unlikePost(storyId.toString(), "user-1");

        assertThat(newCount).isEqualTo(4);
        assertThat(story.getLikesCount()).isEqualTo(4);
        verify(moderationQueueRepository).save(story);
        verify(postLikeRepository).deleteByUserIdentifierAndPostId("user-1", storyId.toString());
    }

    @Test
    void unlikePost_doesNotDecrementBelowZero() {
        UUID storyId = UUID.randomUUID();
        ModerationQueueItem story = new ModerationQueueItem();
        story.setId(storyId);
        story.setLikesCount(0);

        when(moderationQueueRepository.findById(storyId)).thenReturn(Optional.of(story));

        int newCount = service.unlikePost(storyId.toString(), "user-1");

        assertThat(newCount).isEqualTo(0);
        assertThat(story.getLikesCount()).isEqualTo(0);
    }

    @Test
    void getLikesCount_returnsAccurateCountForStory() {
        UUID storyId = UUID.randomUUID();
        ModerationQueueItem story = new ModerationQueueItem();
        story.setId(storyId);
        story.setLikesCount(42);

        when(moderationQueueRepository.findById(storyId)).thenReturn(Optional.of(story));

        int count = service.getLikesCount(storyId.toString());

        assertThat(count).isEqualTo(42);
    }

    @Test
    void deleteComment_deletesCommentFromRepository() {
        FeedItemComment comment = new FeedItemComment();
        comment.setId(10L);
        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));

        service.deleteComment(10L);

        verify(commentRepository).delete(comment);
    }
}

