package lk.ac.sliit.legacylens.moderation.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.moderation.dto.ModerationQueueItemResponse;
import lk.ac.sliit.legacylens.moderation.dto.UpdateModerationStatusRequest;
import lk.ac.sliit.legacylens.moderation.entity.ModerationStatus;
import lk.ac.sliit.legacylens.moderation.service.ModerationQueueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/moderation/queue")
public class ModerationQueueController {

    private final ModerationQueueService moderationQueueService;

    public ModerationQueueController(ModerationQueueService moderationQueueService) {
        this.moderationQueueService = moderationQueueService;
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

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ModerationQueueItemResponse>> updateItemStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateModerationStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(moderationQueueService.updateItemStatus(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable UUID id) {
        moderationQueueService.deleteItem(id);
        return ResponseEntity.ok(ApiResponse.ok("Content permanently deleted", null));
    }
}
