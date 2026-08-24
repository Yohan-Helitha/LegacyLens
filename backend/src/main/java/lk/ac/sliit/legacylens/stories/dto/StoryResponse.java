package lk.ac.sliit.legacylens.stories.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class StoryResponse {

    private UUID id;
    private String title;
    private String description;
    private String status;
    private String method;
    private String mediaType;
    /** Root-relative URL the client can play directly, e.g. "/uploads/stories/xxx.m4a". Null with no clip. */
    private String mediaUrl;
    private Long mediaDurationMillis;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;
}
