package lk.ac.sliit.legacylens.learning.review;

import lk.ac.sliit.legacylens.learning.entity.UserWeakWord;
import lk.ac.sliit.legacylens.learning.repository.UserWeakWordRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "app.learning.review.scheduler", havingValue = "spaced-repetition")
public class SpacedRepetitionScheduler implements ReviewScheduler {

	private final UserWeakWordRepository userWeakWordRepository;
	private final Clock clock;

	public SpacedRepetitionScheduler(
			UserWeakWordRepository userWeakWordRepository,
			Clock clock) {
		this.userWeakWordRepository = userWeakWordRepository;
		this.clock = clock;
	}

	@Override
	public String getStrategyName() {
		return "spaced-repetition";
	}

	@Override
	public List<UserWeakWord> selectWordsForReview(UUID userId, int limit) {
		int safeLimit = Math.max(1, limit);
		LocalDateTime now = LocalDateTime.now(clock);
		List<UserWeakWord> candidateWords = userWeakWordRepository.findByUserIdAndMasteredFalseOrderByNextReviewAtAsc(userId);

		List<UserWeakWord> sortedWords = candidateWords.stream()
				.sorted(Comparator
						.comparing((UserWeakWord w) -> w.getNextReviewAt() == null || !w.getNextReviewAt().isAfter(now) ? 0 : 1)
						.thenComparing(w -> w.getBox() == null ? 1 : w.getBox())
						.thenComparing(w -> w.getNextReviewAt() == null ? LocalDateTime.MIN : w.getNextReviewAt()))
				.limit(safeLimit)
				.toList();

		return sortedWords;
	}
}
