package lk.ac.sliit.legacylens.learning.review;

import lk.ac.sliit.legacylens.learning.entity.UserWeakWord;

import java.util.List;
import java.util.UUID;

public interface ReviewScheduler {

	String getStrategyName();

	List<UserWeakWord> selectWordsForReview(UUID userId, int limit);
}
