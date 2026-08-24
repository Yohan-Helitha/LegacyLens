package lk.ac.sliit.legacylens.learning.dto;

public class NextLessonResponse {

    private boolean completed;
    private LessonInfo nextLesson;

    public NextLessonResponse(
            boolean completed,
            LessonInfo nextLesson) {

        this.completed = completed;
        this.nextLesson = nextLesson;
    }

    public boolean isCompleted() {
        return completed;
    }

    public LessonInfo getNextLesson() {
        return nextLesson;
    }

    public static class LessonInfo {

        private Long lessonId;
        private int lessonOrder;
        private String title;
        private String description;
        private String type;

        public LessonInfo(
                Long lessonId,
                int lessonOrder,
                String title,
                String description,
                String type) {

            this.lessonId = lessonId;
            this.lessonOrder = lessonOrder;
            this.title = title;
            this.description = description;
            this.type = type;
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

        public String getType() {
            return type;
        }
    }
}