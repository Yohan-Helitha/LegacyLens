package lk.ac.sliit.legacylens.learning.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class QuizSubmissionRequest {

    @NotEmpty(message = "Answers are required")
    @Valid
    private List<QuizAnswerRequest> answers;
}