package lk.ac.sliit.legacylens.learning;

import lk.ac.sliit.legacylens.learning.progress.DefaultXpPolicy;
import lk.ac.sliit.legacylens.learning.progress.XpPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class XpPolicyTest {

	private XpPolicy xpPolicy;

	@BeforeEach
	void setUp() {
		xpPolicy = new DefaultXpPolicy(60);
	}

	@Test
	@DisplayName("Calculates quiz XP correctly for passing score")
	void testQuizXpPassed() {
		int xp = 0;

		xp = xpPolicy.calculateQuizXp(4, true);

		// 4 * 10 + 20 bonus = 60
		assertEquals(60, xp);
	}

	@Test
	@DisplayName("Calculates quiz XP correctly for failing score without bonus")
	void testQuizXpFailed() {
		int xp = 0;

		xp = xpPolicy.calculateQuizXp(2, false);

		// 2 * 10 = 20
		assertEquals(20, xp);
	}

	@Test
	@DisplayName("Awards flashcard completion XP")
	void testFlashcardLessonXp() {
		int xp = 0;

		xp = xpPolicy.calculateFlashcardLessonXp(true);

		assertEquals(20, xp);
	}

	@Test
	@DisplayName("Enforces daily XP cap for AI-generated study sets")
	void testAiSetDailyXpCap() {
		int firstAttemptXp = 0;
		int secondAttemptXp = 0;
		int thirdAttemptXp = 0;

		// Cap is 60. First attempt gets 40 (passed with 2 correct: 20 + 20)
		firstAttemptXp = xpPolicy.calculateAiSetXp(2, true, 0);

		// Second attempt tries to get 40, but only 20 remaining allowance
		secondAttemptXp = xpPolicy.calculateAiSetXp(2, true, 40);

		// Third attempt after reaching 60 cap
		thirdAttemptXp = xpPolicy.calculateAiSetXp(2, true, 60);

		assertEquals(40, firstAttemptXp);
		assertEquals(20, secondAttemptXp);
		assertEquals(0, thirdAttemptXp);
	}
}
