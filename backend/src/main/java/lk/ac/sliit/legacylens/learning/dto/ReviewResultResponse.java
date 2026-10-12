package lk.ac.sliit.legacylens.learning.dto;

import java.util.List;

public class ReviewResultResponse {

	private int totalQuestions;
	private int correctCount;
	private int percentage;
	private int xpEarned;
	private int masteredCount;
	private List<String> masteredWords;
	private List<ReviewAnswerResultDto> results;

	public ReviewResultResponse() {
	}

	public ReviewResultResponse(
			int totalQuestions,
			int correctCount,
			int percentage,
			int xpEarned,
			int masteredCount,
			List<String> masteredWords,
			List<ReviewAnswerResultDto> results) {
		this.totalQuestions = totalQuestions;
		this.correctCount = correctCount;
		this.percentage = percentage;
		this.xpEarned = xpEarned;
		this.masteredCount = masteredCount;
		this.masteredWords = masteredWords;
		this.results = results;
	}

	public int getTotalQuestions() {
		return totalQuestions;
	}

	public void setTotalQuestions(int totalQuestions) {
		this.totalQuestions = totalQuestions;
	}

	public int getCorrectCount() {
		return correctCount;
	}

	public void setCorrectCount(int correctCount) {
		this.correctCount = correctCount;
	}

	public int getPercentage() {
		return percentage;
	}

	public void setPercentage(int percentage) {
		this.percentage = percentage;
	}

	public int getXpEarned() {
		return xpEarned;
	}

	public void setXpEarned(int xpEarned) {
		this.xpEarned = xpEarned;
	}

	public int getMasteredCount() {
		return masteredCount;
	}

	public void setMasteredCount(int masteredCount) {
		this.masteredCount = masteredCount;
	}

	public List<String> getMasteredWords() {
		return masteredWords;
	}

	public void setMasteredWords(List<String> masteredWords) {
		this.masteredWords = masteredWords;
	}

	public List<ReviewAnswerResultDto> getResults() {
		return results;
	}

	public void setResults(List<ReviewAnswerResultDto> results) {
		this.results = results;
	}

	public static class ReviewAnswerResultDto {

		private String questionId;
		private Long flashcardId;
		private String word;
		private boolean correct;
		private String selectedOption;
		private String correctOption;
		private String meaning;
		private int consecutiveCorrect;
		private boolean mastered;

		public ReviewAnswerResultDto() {
		}

		public ReviewAnswerResultDto(
				String questionId,
				Long flashcardId,
				String word,
				boolean correct,
				String selectedOption,
				String correctOption,
				String meaning,
				int consecutiveCorrect,
				boolean mastered) {
			this.questionId = questionId;
			this.flashcardId = flashcardId;
			this.word = word;
			this.correct = correct;
			this.selectedOption = selectedOption;
			this.correctOption = correctOption;
			this.meaning = meaning;
			this.consecutiveCorrect = consecutiveCorrect;
			this.mastered = mastered;
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

		public String getWord() {
			return word;
		}

		public void setWord(String word) {
			this.word = word;
		}

		public boolean isCorrect() {
			return correct;
		}

		public void setCorrect(boolean correct) {
			this.correct = correct;
		}

		public String getSelectedOption() {
			return selectedOption;
		}

		public void setSelectedOption(String selectedOption) {
			this.selectedOption = selectedOption;
		}

		public String getCorrectOption() {
			return correctOption;
		}

		public void setCorrectOption(String correctOption) {
			this.correctOption = correctOption;
		}

		public String getMeaning() {
			return meaning;
		}

		public void setMeaning(String meaning) {
			this.meaning = meaning;
		}

		public int getConsecutiveCorrect() {
			return consecutiveCorrect;
		}

		public void setConsecutiveCorrect(int consecutiveCorrect) {
			this.consecutiveCorrect = consecutiveCorrect;
		}

		public boolean isMastered() {
			return mastered;
		}

		public void setMastered(boolean mastered) {
			this.mastered = mastered;
		}
	}
}
