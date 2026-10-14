package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.UserWeakWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserWeakWordRepository extends JpaRepository<UserWeakWord, Long> {

	Optional<UserWeakWord> findByUserIdAndFlashcardId(UUID userId, Long flashcardId);

	List<UserWeakWord> findByUserIdAndMasteredFalseOrderByErrorCountDesc(UUID userId);

	List<UserWeakWord> findByUserIdAndMasteredFalseOrderByNextReviewAtAsc(UUID userId);

	List<UserWeakWord> findByUserIdOrderByErrorCountDesc(UUID userId);

	long countByUserIdAndMasteredFalse(UUID userId);

	long countByUserIdAndMasteredTrue(UUID userId);

	@Modifying
	@Query("UPDATE UserWeakWord w SET w.errorCount = w.errorCount + 1, w.consecutiveCorrect = 0, w.mastered = false, w.lastFailedAt = :lastFailedAt, w.box = 1, w.nextReviewAt = :nextReviewAt WHERE w.userId = :userId AND w.flashcard.id = :flashcardId")
	int recordFailureAtomic(
			@Param("userId") UUID userId,
			@Param("flashcardId") Long flashcardId,
			@Param("lastFailedAt") LocalDateTime lastFailedAt,
			@Param("nextReviewAt") LocalDateTime nextReviewAt
	);

	@Modifying
	@Query("UPDATE UserWeakWord w SET w.consecutiveCorrect = w.consecutiveCorrect + 1, w.mastered = CASE WHEN (w.consecutiveCorrect + 1) >= :masteryThreshold THEN true ELSE false END, w.box = CASE WHEN w.box < 5 THEN w.box + 1 ELSE 5 END, w.nextReviewAt = :nextReviewAt WHERE w.userId = :userId AND w.flashcard.id = :flashcardId AND w.mastered = false")
	int recordSuccessAtomic(
			@Param("userId") UUID userId,
			@Param("flashcardId") Long flashcardId,
			@Param("masteryThreshold") int masteryThreshold,
			@Param("nextReviewAt") LocalDateTime nextReviewAt
	);
}
