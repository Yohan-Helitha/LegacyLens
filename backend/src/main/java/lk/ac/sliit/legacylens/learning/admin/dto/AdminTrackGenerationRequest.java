package lk.ac.sliit.legacylens.learning.admin.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTrackGenerationRequest {

	@Size(max = 20000)
	private String sourceText;

	private String storyId;
	private String region;
	private String occupation;
	private String difficultyLevel;
	private Integer lessonCount;
	private Integer flashcardCount;
	private Integer quizQuestionCount;
}
