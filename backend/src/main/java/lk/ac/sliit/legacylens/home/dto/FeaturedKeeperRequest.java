package lk.ac.sliit.legacylens.home.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeaturedKeeperRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Tag is required")
    private String tag;

    @NotBlank(message = "Quote is required")
    private String quote;

    private String avatarUrl;
    private Integer likesCount;
    private String storyId;
    private String storyTitle;
    private LocalDate activeDate;
    private String status; // Active | Scheduled | Draft
}

