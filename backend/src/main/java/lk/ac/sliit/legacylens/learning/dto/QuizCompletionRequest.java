package lk.ac.sliit.legacylens.learning.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuizCompletionRequest {

   @NotNull(message = "Correct answers is required")
    @Min(value = 0, message = "Correct answers cannot be negative")
    private Integer correctAnswers;
}