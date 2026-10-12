package lk.ac.sliit.legacylens.learning.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyAttemptResultResponse {

	private Long attemptId;
	private Long trackId;
	private Long lessonId;
	private int score;
	private int total;
	private int percentage;
	private boolean passed;
	private int xpAwarded;
	private boolean firstAttempt;
	private Instant takenAt;
}
