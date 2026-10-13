package lk.ac.sliit.legacylens.learning.ai.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStudyJobRequest {

	@NotEmpty(message = "At least one source item must be selected")
	private List<String> sourceIds;

	@Builder.Default
	private boolean includeQuiz = true;

	@Builder.Default
	private boolean includeFlashcards = true;

	@Builder.Default
	private boolean includeMiniCourse = false;

	@Builder.Default
	private boolean includeCertificate = false;

	private Integer quizQuestionCount;
	private Integer flashcardCount;
	private Integer courseLessonCount;
}
