package lk.ac.sliit.legacylens.contentcapture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** A listener's comment on a published story — shown to its author as a review. */
@Data
@Builder
@AllArgsConstructor
public class StoryReviewDto {

    private String reviewerName;
    private String reviewerAvatarUrl;
    private String text;
    private LocalDateTime createdAt;
}
