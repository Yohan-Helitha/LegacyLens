package lk.ac.sliit.legacylens.learning.dto;

public class LessonProgressItem {

    private Long lessonId;
    private int lessonOrder;
    private String title;
    private String description;
    private boolean completed;
    private int score;
    private int xpEarned;

    public LessonProgressItem(
            Long lessonId,
            int lessonOrder,
            String title,
            String description,
            boolean completed,
            int score,
            int xpEarned) {

        this.lessonId = lessonId;
        this.lessonOrder = lessonOrder;
        this.title = title;
        this.description = description;
        this.completed = completed;
        this.score = score;
        this.xpEarned = xpEarned;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public int getLessonOrder() {
        return lessonOrder;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public boolean isCompleted() {
        return completed;
    }

    public int getScore() {
        return score;
    }

    public int getXpEarned() {
        return xpEarned;
    }
}