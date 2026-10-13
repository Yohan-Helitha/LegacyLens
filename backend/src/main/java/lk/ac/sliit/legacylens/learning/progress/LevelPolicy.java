package lk.ac.sliit.legacylens.learning.progress;

public interface LevelPolicy {

	int calculateLevel(int totalXp);

	int getXpForCurrentLevel(int currentLevel);

	int getXpForNextLevel(int currentLevel);

	boolean isLevelUp(int oldXp, int newXp);
}
