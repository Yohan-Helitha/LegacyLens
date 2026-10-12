package lk.ac.sliit.legacylens.learning.review;

import lk.ac.sliit.legacylens.learning.entity.UserWeakWord;
import lk.ac.sliit.legacylens.learning.repository.UserWeakWordRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "app.learning.review.scheduler", havingValue = "most-missed", matchIfMissing = true)
public class MostMissedFirstScheduler implements ReviewScheduler {

	private final UserWeakWordRepository userWeakWordRepository;

	public MostMissedFirstScheduler(UserWeakWordRepository userWeakWordRepository) {
		this.userWeakWordRepository = userWeakWordRepository;
	}

	@Override
	public String getStrategyName() {
		return "most-missed";
	}

	@Override
	public List<UserWeakWord> selectWordsForReview(UUID userId, int limit) {
		int safeLimit = Math.max(1, limit);
		List<UserWeakWord> weakWords = userWeakWordRepository.findByUserIdAndMasteredFalseOrderByErrorCountDesc(userId);

		List<UserWeakWord> selectedWords = weakWords.stream()
				.limit(safeLimit)
				.toList();

		return selectedWords;
	}
}
