package lk.ac.sliit.legacylens.learning.dto;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class QuizAnswerRequest {

    @NotNull
    private Long questionId;

    @NotBlank
    private String selectedOption;
}