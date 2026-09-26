package lk.ac.sliit.legacylens.moderation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiGenerateQuizRequest {
    @NotBlank(message = "Quiz title is required")
    @Size(max = 200, message = "Quiz title must not exceed 200 characters")
    private String title;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @NotBlank(message = "Body content is required")
    private String bodyContent;

    private List<String> tags;
}
