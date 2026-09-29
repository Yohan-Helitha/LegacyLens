package lk.ac.sliit.legacylens.map.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveQuestRequest {
    private Long id;
    private Long landmarkId;
    private String landmarkCode;

    @NotBlank(message = "Quest title is required")
    private String title;

    private String description;
    private List<CreateQuestionRequest> questions;
}
