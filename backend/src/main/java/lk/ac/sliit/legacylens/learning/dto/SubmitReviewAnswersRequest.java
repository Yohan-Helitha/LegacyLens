package lk.ac.sliit.legacylens.learning.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class SubmitReviewAnswersRequest {

	private String sessionId;

	@NotNull
	@NotEmpty
	private List<ReviewAnswerItem> answers;

	public SubmitReviewAnswersRequest() {
	}

	public SubmitReviewAnswersRequest(String sessionId, List<ReviewAnswerItem> answers) {
		this.sessionId = sessionId;
		this.answers = answers;
	}

	public String getSessionId() {
		return sessionId;
	}

	public void setSessionId(String sessionId) {
		this.sessionId = sessionId;
	}

	public List<ReviewAnswerItem> getAnswers() {
		return answers;
	}

	public void setAnswers(List<ReviewAnswerItem> answers) {
		this.answers = answers;
	}

	public static class ReviewAnswerItem {

		private String questionId;

		@NotNull
		private Long flashcardId;

		@NotNull
		private String selectedOption;

		public ReviewAnswerItem() {
		}

		public ReviewAnswerItem(String questionId, Long flashcardId, String selectedOption) {
			this.questionId = questionId;
			this.flashcardId = flashcardId;
			this.selectedOption = selectedOption;
		}

		public String getQuestionId() {
			return questionId;
		}

		public void setQuestionId(String questionId) {
			this.questionId = questionId;
		}

		public Long getFlashcardId() {
			return flashcardId;
		}

		public void setFlashcardId(Long flashcardId) {
			this.flashcardId = flashcardId;
		}

		public String getSelectedOption() {
			return selectedOption;
		}

		public void setSelectedOption(String selectedOption) {
			this.selectedOption = selectedOption;
		}
	}
}
