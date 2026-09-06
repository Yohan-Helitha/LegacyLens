package lk.ac.sliit.legacylens.home.controller;

import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.home.dto.FeedItemResponse;
import lk.ac.sliit.legacylens.home.service.FeedItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/home/feed")
public class FeedItemController {

    private final FeedItemService service;

    public FeedItemController(FeedItemService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeedItemResponse>>> getAllFeedItems() {
        return ResponseEntity.ok(ApiResponse.ok(service.getAllFeedItems()));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<lk.ac.sliit.legacylens.home.dto.CommentResponse>>> getComments(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getComments(id)));
    }

    @org.springframework.web.bind.annotation.PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<lk.ac.sliit.legacylens.home.dto.CommentResponse>> addComment(
            @org.springframework.web.bind.annotation.PathVariable Long id, 
            @org.springframework.web.bind.annotation.RequestBody lk.ac.sliit.legacylens.home.dto.CommentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.addComment(id, request)));
    }

    @org.springframework.web.bind.annotation.PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<Void>> likePost(@org.springframework.web.bind.annotation.PathVariable Long id) {
        service.likePost(id);
        return ResponseEntity.ok(ApiResponse.ok("Post liked successfully", null));
    }
}
