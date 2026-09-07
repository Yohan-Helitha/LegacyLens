package lk.ac.sliit.legacylens.moderation.dto;

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
    private String title;
    private String description;
    private String bodyContent;
    private List<String> tags;
}
