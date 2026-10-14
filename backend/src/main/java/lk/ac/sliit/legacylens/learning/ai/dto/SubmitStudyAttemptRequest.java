package lk.ac.sliit.legacylens.learning.ai.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitStudyAttemptRequest {

	@NotNull(message = "Lesson ID is required")
	private Long lessonId;

	@NotEmpty(message = "Answers list must not be empty")
	private List<QuizAnswerItem> answers;

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class QuizAnswerItem {
		private Long questionId;
		private String selectedOption;
	}
}
