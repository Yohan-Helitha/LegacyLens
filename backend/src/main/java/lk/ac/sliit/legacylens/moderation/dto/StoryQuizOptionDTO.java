package lk.ac.sliit.legacylens.moderation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryQuizOptionDTO {
    private String id;
    private String optionKey; // "A", "B", "C", "D"
    private String optionText;
    private String description;
    private boolean isCorrect;
}
