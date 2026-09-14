package lk.ac.sliit.legacylens.learning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LessonProgressResponse {

    private Long lessonId;
    private boolean completed;
    private Integer score;
    private Integer xpEarned;
}