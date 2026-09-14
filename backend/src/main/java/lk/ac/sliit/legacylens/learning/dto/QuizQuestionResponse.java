package lk.ac.sliit.legacylens.learning.dto;

import lk.ac.sliit.legacylens.learning.entity.QuizQuestion;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class QuizQuestionResponse {

    private Long id;
    private String question;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;

    public static QuizQuestionResponse fromEntity(QuizQuestion question) {
        return new QuizQuestionResponse(
                question.getId(),
                question.getQuestion(),
                question.getOptionA(),
                question.getOptionB(),
                question.getOptionC(),
                question.getOptionD()
        );
    }
}