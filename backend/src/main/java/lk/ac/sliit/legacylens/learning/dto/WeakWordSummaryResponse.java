package lk.ac.sliit.legacylens.learning.dto;

import java.time.LocalDateTime;

public class WeakWordSummaryResponse {

	private Long id;
	private Long flashcardId;
	private String word;
	private String meaning;
	private String culturalNote;
	private String audioUrl;
	private int errorCount;
	private int consecutiveCorrect;
	private boolean mastered;
	private LocalDateTime lastFailedAt;
	private LocalDateTime nextReviewAt;
	private Integer box;

	public WeakWordSummaryResponse() {
	}

	public WeakWordSummaryResponse(
			Long id,
			Long flashcardId,
			String word,
			String meaning,
			String culturalNote,
			String audioUrl,
			int errorCount,
			int consecutiveCorrect,
			boolean mastered,
			LocalDateTime lastFailedAt,
			LocalDateTime nextReviewAt,
			Integer box) {
		this.id = id;
		this.flashcardId = flashcardId;
		this.word = word;
		this.meaning = meaning;
		this.culturalNote = culturalNote;
		this.audioUrl = audioUrl;
		this.errorCount = errorCount;
		this.consecutiveCorrect = consecutiveCorrect;
		this.mastered = mastered;
		this.lastFailedAt = lastFailedAt;
		this.nextReviewAt = nextReviewAt;
		this.box = box;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
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

	public String getMeaning() {
		return meaning;
	}

	public void setMeaning(String meaning) {
		this.meaning = meaning;
	}

	public String getCulturalNote() {
		return culturalNote;
	}

	public void setCulturalNote(String culturalNote) {
		this.culturalNote = culturalNote;
	}

	public String getAudioUrl() {
		return audioUrl;
	}

	public void setAudioUrl(String audioUrl) {
		this.audioUrl = audioUrl;
	}

	public int getErrorCount() {
		return errorCount;
	}

	public void setErrorCount(int errorCount) {
		this.errorCount = errorCount;
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

	public LocalDateTime getLastFailedAt() {
		return lastFailedAt;
	}

	public void setLastFailedAt(LocalDateTime lastFailedAt) {
		this.lastFailedAt = lastFailedAt;
	}

	public LocalDateTime getNextReviewAt() {
		return nextReviewAt;
	}

	public void setNextReviewAt(LocalDateTime nextReviewAt) {
		this.nextReviewAt = nextReviewAt;
	}

	public Integer getBox() {
		return box;
	}

	public void setBox(Integer box) {
		this.box = box;
	}
}
