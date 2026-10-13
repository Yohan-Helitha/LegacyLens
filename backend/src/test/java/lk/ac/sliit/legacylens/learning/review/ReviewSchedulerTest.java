package lk.ac.sliit.legacylens.learning.review;

import lk.ac.sliit.legacylens.learning.entity.Flashcard;
import lk.ac.sliit.legacylens.learning.entity.UserWeakWord;
import lk.ac.sliit.legacylens.learning.repository.UserWeakWordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ReviewSchedulerTest {

	private UserWeakWordRepository userWeakWordRepository;
	private Clock fixedClock;
	private MostMissedFirstScheduler mostMissedScheduler;
	private SpacedRepetitionScheduler spacedScheduler;
	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		userWeakWordRepository = mock(UserWeakWordRepository.class);
		fixedClock = Clock.fixed(Instant.parse("2026-10-12T10:00:00Z"), ZoneId.of("Asia/Colombo"));

		mostMissedScheduler = new MostMissedFirstScheduler(userWeakWordRepository);
		spacedScheduler = new SpacedRepetitionScheduler(userWeakWordRepository, fixedClock);
	}

	@Test
	@DisplayName("MostMissedFirstScheduler limits and returns highest error count weak words")
	void testMostMissedScheduler() {
		UserWeakWord w1 = createWeakWord(1L, 10, false, null, 1);
		UserWeakWord w2 = createWeakWord(2L, 5, false, null, 2);
		UserWeakWord w3 = createWeakWord(3L, 2, false, null, 1);

		when(userWeakWordRepository.findByUserIdAndMasteredFalseOrderByErrorCountDesc(userId))
				.thenReturn(List.of(w1, w2, w3));

		List<UserWeakWord> result = mostMissedScheduler.selectWordsForReview(userId, 2);

		assertEquals(2, result.size());
		assertEquals(10, result.get(0).getErrorCount());
		assertEquals(5, result.get(1).getErrorCount());
		assertEquals("most-missed", mostMissedScheduler.getStrategyName());
	}

	@Test
	@DisplayName("SpacedRepetitionScheduler prioritizes due cards and lower boxes")
	void testSpacedRepetitionScheduler() {
		LocalDateTime now = LocalDateTime.now(fixedClock);
		UserWeakWord dueCard = createWeakWord(1L, 3, false, now.minusHours(2), 1);
		UserWeakWord futureCard = createWeakWord(2L, 8, false, now.plusDays(3), 2);
		UserWeakWord unscheduledCard = createWeakWord(3L, 4, false, null, 1);

		when(userWeakWordRepository.findByUserIdAndMasteredFalseOrderByNextReviewAtAsc(userId))
				.thenReturn(List.of(dueCard, unscheduledCard, futureCard));

		List<UserWeakWord> result = spacedScheduler.selectWordsForReview(userId, 2);

		assertEquals(2, result.size());
		assertEquals("spaced-repetition", spacedScheduler.getStrategyName());
	}

	private UserWeakWord createWeakWord(Long id, int errorCount, boolean mastered, LocalDateTime nextReview, int box) {
		UserWeakWord word = new UserWeakWord();
		Flashcard fc = new Flashcard();
		fc.setId(id);
		fc.setWord("Word" + id);
		fc.setMeaning("Meaning" + id);

		word.setId(id);
		word.setUserId(userId);
		word.setFlashcard(fc);
		word.setErrorCount(errorCount);
		word.setMastered(mastered);
		word.setNextReviewAt(nextReview);
		word.setBox(box);

		return word;
	}
}
