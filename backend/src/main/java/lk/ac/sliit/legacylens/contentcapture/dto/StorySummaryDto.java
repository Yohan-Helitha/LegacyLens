package lk.ac.sliit.legacylens.contentcapture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** Lightweight row shape for the "My Stories" list — see StoryQueryService. */
@Data
@Builder
@AllArgsConstructor
public class StorySummaryDto {

    private UUID id;
    private String title;
    private String status;
    private String mediaType;
    /** Root-relative URL, e.g. "/uploads/stories/xxx.m4a". Null with no clip. */
    private String mediaUrl;
    private long viewCount;
    private LocalDateTime createdAt;
}
