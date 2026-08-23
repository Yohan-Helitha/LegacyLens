package lk.ac.sliit.legacylens.learning.dto;

import java.util.List;

public class TrackDashboardResponse {

    private Long trackId;
    private String trackTitle;
    private long completedLessons;
    private long totalLessons;
    private double progressPercentage;
    private long totalXp;
    private boolean completed;
    private List<LessonProgressItem> lessons;

    public TrackDashboardResponse(
            Long trackId,
            String trackTitle,
            long completedLessons,
            long totalLessons,
            double progressPercentage,
            long totalXp,
            boolean completed,
            List<LessonProgressItem> lessons) {

        this.trackId = trackId;
        this.trackTitle = trackTitle;
        this.completedLessons = completedLessons;
        this.totalLessons = totalLessons;
        this.progressPercentage = progressPercentage;
        this.totalXp = totalXp;
        this.completed = completed;
        this.lessons = lessons;
    }

    public Long getTrackId() {
        return trackId;
    }

    public String getTrackTitle() {
        return trackTitle;
    }

    public long getCompletedLessons() {
        return completedLessons;
    }

    public long getTotalLessons() {
        return totalLessons;
    }

    public double getProgressPercentage() {
        return progressPercentage;
    }

    public long getTotalXp() {
        return totalXp;
    }

    public boolean isCompleted() {
        return completed;
    }

    public List<LessonProgressItem> getLessons() {
        return lessons;
    }
}