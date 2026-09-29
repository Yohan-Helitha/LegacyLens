package lk.ac.sliit.legacylens.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationResponse {
    private String id;
    private String title;
    private String subtitle;
    private String body;
    private LocalDateTime createdAt;
    private String type; // "opportunity" or "moderation"
    private boolean isRead;
}

