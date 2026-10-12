package lk.ac.sliit.legacylens.learning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TrackProgressResponse {

    private Long trackId;
    private String trackTitle;
    private int totalLessons;
    private long completedLessons;
    private int progressPercentage;
    private long xpEarned;
}