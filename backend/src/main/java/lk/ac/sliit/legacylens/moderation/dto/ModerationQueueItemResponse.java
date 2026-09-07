package lk.ac.sliit.legacylens.moderation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class ModerationQueueItemResponse {
    private UUID id;
    private String title;
    private String description;
    private String bodyContent;
    private String imageUrl;
    private String type;
    private String authorName;
    private String authorUserId;
    private boolean elder;
    private String[] tags;
    private String status;
    private String rejectionReason;
    private String rejectionNotes;
    private String createdAt;
    private String updatedAt;
}
