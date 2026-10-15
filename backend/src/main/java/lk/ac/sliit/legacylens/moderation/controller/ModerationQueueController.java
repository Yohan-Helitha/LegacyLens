package lk.ac.sliit.legacylens.moderation.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.moderation.dto.ModerationQueueItemResponse;
import lk.ac.sliit.legacylens.moderation.dto.UpdateModerationStatusRequest;
import lk.ac.sliit.legacylens.moderation.service.ModerationQueueService;
import lk.ac.sliit.legacylens.common.storage.MediaStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/moderation/queue")
public class ModerationQueueController {

    private final ModerationQueueService moderationQueueService;
    private final MediaStorageService mediaStorageService;

    public ModerationQueueController(
            ModerationQueueService moderationQueueService,
            MediaStorageService mediaStorageService) {
        this.moderationQueueService = moderationQueueService;
        this.mediaStorageService = mediaStorageService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ModerationQueueItemResponse>>> getAllItems(
            @RequestParam(required = false, defaultValue = "ALL") String status) {
        return ResponseEntity.ok(ApiResponse.ok(moderationQueueService.getAllItems(status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ModerationQueueItemResponse>> getItem(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(moderationQueueService.getItem(id)));
    }

    @PostMapping("/upload-cover")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadCoverImage(
            @RequestParam("file") MultipartFile file) {
        String url = mediaStorageService.storeBlogImage(file, "covers");
        return ResponseEntity.ok(ApiResponse.ok("Cover image uploaded successfully", Map.of("imageUrl", url)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ModerationQueueItemResponse>> updateItemStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateModerationStatusRequest request,
            @RequestHeader(value = "X-Admin-Id", defaultValue = "unknown") String adminId,
            @RequestHeader(value = "X-Admin-Name", defaultValue = "Admin") String adminName) {
        return ResponseEntity.ok(ApiResponse.ok(
                moderationQueueService.updateItemStatus(id, request, adminId, adminName)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Admin-Id", defaultValue = "unknown") String adminId,
            @RequestHeader(value = "X-Admin-Name", defaultValue = "Admin") String adminName) {
        moderationQueueService.deleteItem(id, adminId, adminName);
        return ResponseEntity.ok(ApiResponse.ok("Content permanently deleted", null));
    }
}
