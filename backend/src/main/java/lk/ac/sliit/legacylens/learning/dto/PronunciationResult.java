package lk.ac.sliit.legacylens.learning.dto;

public class PronunciationResult {
    private boolean passed;
    private int score;
    private String feedback;

    public PronunciationResult() {
    }

    public PronunciationResult(boolean passed, int score, String feedback) {
        this.passed = passed;
        this.score = score;
        this.feedback = feedback;
    }

    public boolean isPassed() {
        return passed;
    }

    public void setPassed(boolean passed) {
        this.passed = passed;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
