package lk.ac.sliit.legacylens.home.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.home.dto.CommentRequest;
import lk.ac.sliit.legacylens.home.dto.CommentResponse;
import lk.ac.sliit.legacylens.home.dto.FeedItemResponse;
import lk.ac.sliit.legacylens.home.service.FeedItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FeedItemControllerTest {

    private MockMvc mockMvc;

    @Mock
    private FeedItemService feedItemService;

    @InjectMocks
    private FeedItemController feedItemController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(feedItemController).build();
    }

    @Test
    void getAllFeedItems_returnsFeedList() throws Exception {
        FeedItemResponse item = new FeedItemResponse();
        item.setId(UUID.randomUUID().toString());
        item.setTitle("Sigiriya Frescoes Preservation");
        item.setType("blog");

        when(feedItemService.getAllFeedItems(any())).thenReturn(List.of(item));

        mockMvc.perform(get("/api/home/feed")
                        .header("X-User-Id", "tester-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title", is("Sigiriya Frescoes Preservation")));
    }

    @Test
    void getComments_returnsCommentsForPost() throws Exception {
        String postId = UUID.randomUUID().toString();
        CommentResponse c1 = CommentResponse.builder()
                .id("100")
                .author("Nimal")
                .text("A treasured piece of our island heritage.")
                .build();

        when(feedItemService.getComments(postId)).thenReturn(List.of(c1));

        mockMvc.perform(get("/api/home/feed/{id}/comments", postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].author", is("Nimal")));
    }

    @Test
    void addComment_savesCommentSuccessfully() throws Exception {
        String postId = UUID.randomUUID().toString();
        CommentRequest request = new CommentRequest();
        request.setAuthor("Kamala");
        request.setText("Inspiring story!");

        CommentResponse saved = CommentResponse.builder()
                .id("101")
                .author("Kamala")
                .text("Inspiring story!")
                .build();

        when(feedItemService.addComment(eq(postId), any(CommentRequest.class))).thenReturn(saved);

        mockMvc.perform(post("/api/home/feed/{id}/comments", postId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is("101")))
                .andExpect(jsonPath("$.data.text", is("Inspiring story!")));
    }

    @Test
    void deleteCommentWithPostId_returnsOk() throws Exception {
        String postId = UUID.randomUUID().toString();
        Long commentId = 55L;

        mockMvc.perform(delete("/api/home/feed/{id}/comments/{commentId}", postId, commentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Comment deleted successfully")));

        verify(feedItemService).deleteComment(commentId);
    }

    @Test
    void likePost_returnsUpdatedCount() throws Exception {
        String postId = UUID.randomUUID().toString();
        when(feedItemService.likePost(eq(postId), any())).thenReturn(15);

        mockMvc.perform(post("/api/home/feed/{id}/like", postId)
                        .header("X-User-Id", "user-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(15)));
    }

    @Test
    void unlikePost_returnsUpdatedCount() throws Exception {
        String postId = UUID.randomUUID().toString();
        when(feedItemService.unlikePost(eq(postId), any())).thenReturn(14);

        mockMvc.perform(post("/api/home/feed/{id}/unlike", postId)
                        .header("X-User-Id", "user-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(14)));
    }

    @Test
    void getLikesCount_returnsCount() throws Exception {
        String postId = UUID.randomUUID().toString();
        when(feedItemService.getLikesCount(postId)).thenReturn(25);

        mockMvc.perform(get("/api/home/feed/{id}/likes", postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(25)));
    }
}

