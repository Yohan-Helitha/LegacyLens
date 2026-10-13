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

    private String resolveUserIdentifier(
            String xUserId,
            String xClientId,
            java.security.Principal principal,
            jakarta.servlet.http.HttpServletRequest request) {
        if (principal != null && principal.getName() != null && !principal.getName().isBlank()) {
            return principal.getName();
        }
        if (xUserId != null && !xUserId.isBlank()) {
            return xUserId.trim();
        }
        if (xClientId != null && !xClientId.isBlank()) {
            return xClientId.trim();
        }
        if (request != null) {
            String remote = request.getHeader("X-Forwarded-For");
            if (remote != null && !remote.isBlank()) {
                return remote.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        }
        return "anonymous";
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeedItemResponse>>> getAllFeedItems(
            @org.springframework.web.bind.annotation.RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @org.springframework.web.bind.annotation.RequestHeader(value = "X-Client-Id", required = false) String xClientId,
            java.security.Principal principal,
            jakarta.servlet.http.HttpServletRequest request) {
        String userIdentifier = resolveUserIdentifier(xUserId, xClientId, principal, request);
        return ResponseEntity.ok(ApiResponse.ok(service.getAllFeedItems(userIdentifier)));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<lk.ac.sliit.legacylens.home.dto.CommentResponse>>> getComments(
            @org.springframework.web.bind.annotation.PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getComments(id)));
    }

    @org.springframework.web.bind.annotation.PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<lk.ac.sliit.legacylens.home.dto.CommentResponse>> addComment(
            @org.springframework.web.bind.annotation.PathVariable String id,
            @org.springframework.web.bind.annotation.RequestBody lk.ac.sliit.legacylens.home.dto.CommentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.addComment(id, request)));
    }

    @org.springframework.web.bind.annotation.PutMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<lk.ac.sliit.legacylens.home.dto.CommentResponse>> updateComment(
            @org.springframework.web.bind.annotation.PathVariable Long commentId,
            @org.springframework.web.bind.annotation.RequestBody lk.ac.sliit.legacylens.home.dto.CommentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateComment(commentId, request)));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}/comments/{commentId}")
    public ResponseEntity<ApiResponse<lk.ac.sliit.legacylens.home.dto.CommentResponse>> updateCommentWithPostId(
            @org.springframework.web.bind.annotation.PathVariable String id,
            @org.springframework.web.bind.annotation.PathVariable Long commentId,
            @org.springframework.web.bind.annotation.RequestBody lk.ac.sliit.legacylens.home.dto.CommentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateComment(commentId, request)));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @org.springframework.web.bind.annotation.PathVariable Long commentId) {
        service.deleteComment(commentId);
        return ResponseEntity.ok(ApiResponse.ok("Comment deleted successfully", null));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteCommentWithPostId(
            @org.springframework.web.bind.annotation.PathVariable String id,
            @org.springframework.web.bind.annotation.PathVariable Long commentId) {
        service.deleteComment(commentId);
        return ResponseEntity.ok(ApiResponse.ok("Comment deleted successfully", null));
    }

    @org.springframework.web.bind.annotation.GetMapping("/{id}/likes")
    public ResponseEntity<ApiResponse<Integer>> getLikesCount(@org.springframework.web.bind.annotation.PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getLikesCount(id)));
    }

    @org.springframework.web.bind.annotation.PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<Integer>> likePost(
            @org.springframework.web.bind.annotation.PathVariable String id,
            @org.springframework.web.bind.annotation.RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @org.springframework.web.bind.annotation.RequestHeader(value = "X-Client-Id", required = false) String xClientId,
            java.security.Principal principal,
            jakarta.servlet.http.HttpServletRequest request) {
        String userIdentifier = resolveUserIdentifier(xUserId, xClientId, principal, request);
        int count = service.likePost(id, userIdentifier);
        return ResponseEntity.ok(ApiResponse.ok("Post liked successfully", count));
    }

    @org.springframework.web.bind.annotation.PostMapping("/{id}/unlike")
    public ResponseEntity<ApiResponse<Integer>> unlikePost(
            @org.springframework.web.bind.annotation.PathVariable String id,
            @org.springframework.web.bind.annotation.RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @org.springframework.web.bind.annotation.RequestHeader(value = "X-Client-Id", required = false) String xClientId,
            java.security.Principal principal,
            jakarta.servlet.http.HttpServletRequest request) {
        String userIdentifier = resolveUserIdentifier(xUserId, xClientId, principal, request);
        int count = service.unlikePost(id, userIdentifier);
        return ResponseEntity.ok(ApiResponse.ok("Post unliked successfully", count));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}/like")
    public ResponseEntity<ApiResponse<Integer>> unlikePostDelete(
            @org.springframework.web.bind.annotation.PathVariable String id,
            @org.springframework.web.bind.annotation.RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @org.springframework.web.bind.annotation.RequestHeader(value = "X-Client-Id", required = false) String xClientId,
            java.security.Principal principal,
            jakarta.servlet.http.HttpServletRequest request) {
        String userIdentifier = resolveUserIdentifier(xUserId, xClientId, principal, request);
        int count = service.unlikePost(id, userIdentifier);
        return ResponseEntity.ok(ApiResponse.ok("Post unliked successfully", count));
    }
}
