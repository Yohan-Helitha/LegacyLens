package lk.ac.sliit.legacylens.learning.progress;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DefaultXpPolicy implements XpPolicy {

	private static final int XP_PER_CORRECT_ANSWER = 10;
	private static final int XP_COMPLETION_BONUS = 20;
	private static final int FLASHCARD_COMPLETION_XP = 20;

	private final int aiSetDailyCap;

	public DefaultXpPolicy(@Value("${app.learning.xp.ai-set-daily-cap:60}") int aiSetDailyCap) {
		this.aiSetDailyCap = aiSetDailyCap > 0 ? aiSetDailyCap : 60;
	}

	@Override
	public int calculateQuizXp(int correctAnswers, boolean completed) {
		int safeCorrect = Math.max(0, correctAnswers);
		int earnedXp = 0;

		earnedXp = safeCorrect * XP_PER_CORRECT_ANSWER;
		if (completed) {
			earnedXp += XP_COMPLETION_BONUS;
		}

		return earnedXp;
	}

	@Override
	public int calculateFlashcardLessonXp(boolean completed) {
		int earnedXp = 0;

		if (completed) {
			earnedXp = FLASHCARD_COMPLETION_XP;
		}

		return earnedXp;
	}

	@Override
	public int calculateAiSetXp(int correctAnswers, boolean completed, int todayAiXpAlreadyEarned) {
		int baseXp = calculateQuizXp(correctAnswers, completed);
		int safeAlreadyEarned = Math.max(0, todayAiXpAlreadyEarned);
		int remainingAllowance = 0;
		int awardedXp = 0;

		remainingAllowance = Math.max(0, aiSetDailyCap - safeAlreadyEarned);
		awardedXp = Math.min(baseXp, remainingAllowance);

		return awardedXp;
	}
}
