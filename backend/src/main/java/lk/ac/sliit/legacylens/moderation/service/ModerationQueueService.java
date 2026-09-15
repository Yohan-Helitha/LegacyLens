package lk.ac.sliit.legacylens.moderation.service;

import lk.ac.sliit.legacylens.moderation.dto.ModerationQueueItemResponse;
import lk.ac.sliit.legacylens.moderation.dto.UpdateModerationStatusRequest;

import java.util.List;
import java.util.UUID;

public interface ModerationQueueService {
    List<ModerationQueueItemResponse> getAllItems(String statusFilter);

    ModerationQueueItemResponse getItem(UUID id);

    ModerationQueueItemResponse updateItemStatus(UUID id, UpdateModerationStatusRequest request);

    void deleteItem(UUID id);
}
