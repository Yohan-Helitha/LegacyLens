package lk.ac.sliit.legacylens.learning.dto;

public class LearningDashboardResponse {

    private long totalXp;
    private long completedLessons;
    private long totalLessons;
    private double progressPercentage;
    private long completedTracks;

    public LearningDashboardResponse(
            long totalXp,
            long completedLessons,
            long totalLessons,
            double progressPercentage,
            long completedTracks) {

        this.totalXp = totalXp;
        this.completedLessons = completedLessons;
        this.totalLessons = totalLessons;
        this.progressPercentage = progressPercentage;
        this.completedTracks = completedTracks;
    }

    public long getTotalXp() {
        return totalXp;
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

    public long getCompletedTracks() {
        return completedTracks;
    }
}