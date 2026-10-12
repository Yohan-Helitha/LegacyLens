package lk.ac.sliit.legacylens.learning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_weak_words", uniqueConstraints = {
		@UniqueConstraint(name = "uk_user_weak_words_user_flashcard", columnNames = {"user_id", "flashcard_id"})
})
public class UserWeakWord {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "flashcard_id", nullable = false)
	private Flashcard flashcard;

	@Column(name = "error_count", nullable = false)
	private int errorCount = 1;

	@Column(name = "consecutive_correct", nullable = false)
	private int consecutiveCorrect = 0;

	@Column(name = "last_failed_at", nullable = false)
	private LocalDateTime lastFailedAt;

	@Column(nullable = false)
	private boolean mastered = false;

	@Column(name = "next_review_at")
	private LocalDateTime nextReviewAt;

	@Column(name = "box")
	private Integer box = 1;

	public UserWeakWord() {
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public UUID getUserId() {
		return userId;
	}

	public void setUserId(UUID userId) {
		this.userId = userId;
	}

	public Flashcard getFlashcard() {
		return flashcard;
	}

	public void setFlashcard(Flashcard flashcard) {
		this.flashcard = flashcard;
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

	public LocalDateTime getLastFailedAt() {
		return lastFailedAt;
	}

	public void setLastFailedAt(LocalDateTime lastFailedAt) {
		this.lastFailedAt = lastFailedAt;
	}

	public boolean isMastered() {
		return mastered;
	}

	public void setMastered(boolean mastered) {
		this.mastered = mastered;
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
