package lk.ac.sliit.legacylens.learning.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminGeneratedTrackPreviewDto {

	private String title;
	private String description;
	private String region;
	private String occupation;
	private String difficultyLevel;
	private String thumbnailUrl;
	private List<AdminGeneratedLessonDto> lessons;

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class AdminGeneratedLessonDto {
		private Integer lessonOrder;
		private String title;
		private String description;
		private String type;
		private List<AdminGeneratedFlashcardDto> flashcards;
		private List<AdminGeneratedQuizDto> quizQuestions;
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class AdminGeneratedFlashcardDto {
		private String word;
		private String meaning;
		private String culturalNote;
		/** Pronunciation audio (mp3/mp4) uploaded by the admin during preview; saved onto the flashcard on publish. */
		private String audioUrl;
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class AdminGeneratedQuizDto {
		private String question;
		private String optionA;
		private String optionB;
		private String optionC;
		private String optionD;
		private String correctOption;
	}
}
