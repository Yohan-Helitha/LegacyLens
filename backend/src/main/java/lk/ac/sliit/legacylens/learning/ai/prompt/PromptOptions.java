package lk.ac.sliit.legacylens.learning.ai.prompt;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromptOptions {

	private boolean includeQuiz;
	private int quizQuestionCount;
	private boolean includeFlashcards;
	private int flashcardCount;
	private boolean includeMiniCourse;
	private int courseLessonCount;
	private boolean includeCertificate;
}
