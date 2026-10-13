package lk.ac.sliit.legacylens.learning.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudySetDetailResponse {

	private Long id;
	private String title;
	private String description;
	private String region;
	private String occupation;
	private Integer totalLessons;
	private List<String> sourceContentIds;
	private LocalDate createdAt;

	@Builder.Default
	private List<LessonSummaryDto> lessons = new ArrayList<>();

	@Builder.Default
	private List<FlashcardDetailDto> flashcards = new ArrayList<>();

	@Builder.Default
	private List<QuizQuestionDetailDto> quizQuestions = new ArrayList<>();

	@Builder.Default
	private List<AttemptHistoryDto> attempts = new ArrayList<>();

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class LessonSummaryDto {
		private Long id;
		private Integer lessonOrder;
		private String title;
		private String description;
		private String type;
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class FlashcardDetailDto {
		private Long id;
		private Long lessonId;
		private String word;
		private String meaning;
		private String culturalNote;
		private String audioUrl;
		private String recordedBy;
		private String sourceContentId;
		private String evidence;
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class QuizQuestionDetailDto {
		private Long id;
		private Long lessonId;
		private String question;
		private String optionA;
		private String optionB;
		private String optionC;
		private String optionD;
		private String correctOption;
		private Long flashcardId;
		private String sourceContentId;
		private String evidence;
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class AttemptHistoryDto {
		private Long id;
		private Long lessonId;
		private Integer score;
		private Integer total;
		private Integer xpAwarded;
		private Instant takenAt;
	}
}
