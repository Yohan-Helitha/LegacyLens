package lk.ac.sliit.legacylens.contentcapture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class ReviewResponseDto {

    private String reviewerName;
    private String reviewerAvatarUrl;
    private int score;
    private String comment;
    private LocalDateTime createdAt;
}
