package lk.ac.sliit.legacylens.learning.progress;

public interface XpPolicy {

	int calculateQuizXp(int correctAnswers, boolean completed);

	int calculateFlashcardLessonXp(boolean completed);

	int calculateAiSetXp(int correctAnswers, boolean completed, int todayAiXpAlreadyEarned);
}
