package lk.ac.sliit.legacylens.home.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeaturedKeeperResponse {
    private Long id;
    private String name;
    private String title;
    private String tag;
    private String quote;
    private String avatarUrl;
    private Integer likesCount;
    private String storyId;
    private String storyTitle;
    private LocalDate activeDate;
    private String status;
    private Boolean generatedByAi;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
