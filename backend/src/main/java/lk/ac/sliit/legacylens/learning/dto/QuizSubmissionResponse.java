package lk.ac.sliit.legacylens.learning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class QuizSubmissionResponse {

    private List<QuizResult> results;
    private int totalScore;
    private long totalQuestions;
    private boolean completed;
    private int xpEarned;
}