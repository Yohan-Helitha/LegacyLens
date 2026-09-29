package lk.ac.sliit.legacylens.stories.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.stories.dto.CreateStoryRequest;
import lk.ac.sliit.legacylens.stories.dto.StoryResponse;
import lk.ac.sliit.legacylens.stories.dto.UpdateStoryRequest;
import lk.ac.sliit.legacylens.stories.service.StoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * The content-capture backend: create/list/view/delete a storyteller's own
 * stories. Everything here requires a valid Bearer token (see
 * SecurityConfig) and only ever acts on the caller's own stories — the
 * author always comes from the JWT principal, never the request body.
 */
@RestController
@RequestMapping("/api/stories")
public class StoryController {

    private final StoryService storyService;

    public StoryController(StoryService storyService) {
        this.storyService = storyService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<StoryResponse>> create(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute CreateStoryRequest request) {

        StoryResponse response = storyService.create(principal.getUser().getId(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Story saved", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<StoryResponse>>> listMine(
            @AuthenticationPrincipal CustomUserDetails principal) {

        List<StoryResponse> stories = storyService.listMine(principal.getUser().getId());

        return ResponseEntity.ok(ApiResponse.ok(stories));
    }

    @GetMapping("/{storyId}")
    public ResponseEntity<ApiResponse<StoryResponse>> getById(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID storyId) {

        StoryResponse story = storyService.getById(principal.getUser().getId(), storyId);

        return ResponseEntity.ok(ApiResponse.ok(story));
    }

    @PatchMapping("/{storyId}")
    public ResponseEntity<ApiResponse<StoryResponse>> update(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID storyId,
            @Valid @RequestBody UpdateStoryRequest request) {

        StoryResponse response = storyService.update(principal.getUser().getId(), storyId, request);

        return ResponseEntity.ok(ApiResponse.ok("Story updated", response));
    }

    @DeleteMapping("/{storyId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID storyId) {

        storyService.delete(principal.getUser().getId(), storyId);

        return ResponseEntity.ok(ApiResponse.ok("Story deleted", null));
    }
}
