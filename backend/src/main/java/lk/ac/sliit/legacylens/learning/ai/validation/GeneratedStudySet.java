package lk.ac.sliit.legacylens.learning.ai.validation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedStudySet {

	private String courseTitle;
	private String courseDescription;
	private String region;
	private String occupation;

	@Builder.Default
	private List<GeneratedLesson> lessons = new ArrayList<>();

	@Builder.Default
	private List<GeneratedFlashcard> flashcards = new ArrayList<>();

	@Builder.Default
	private List<GeneratedQuizQuestion> quizQuestions = new ArrayList<>();

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class GeneratedLesson {
		private String title;
		private String description;
		private String type; // FLASHCARDS or QUIZ
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class GeneratedFlashcard {
		private String word;
		private String meaning;
		private String culturalNote;
		private String sourceContentId;
		private String evidence;
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class GeneratedQuizQuestion {
		private String question;
		private String optionA;
		private String optionB;
		private String optionC;
		private String optionD;
		private String correctOption;
		private String flashcardWord;
		private String sourceContentId;
		private String evidence;
	}
}
