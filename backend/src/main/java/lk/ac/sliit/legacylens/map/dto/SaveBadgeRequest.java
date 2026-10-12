package lk.ac.sliit.legacylens.map.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveBadgeRequest {
    private Long landmarkId;
    private String landmarkCode;

    @NotBlank(message = "Badge code is required")
    private String badgeCode;

    @NotBlank(message = "Badge title is required")
    private String title;

    private String image;
}
