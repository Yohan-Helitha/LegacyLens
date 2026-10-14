package lk.ac.sliit.legacylens.learning.progress;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DefaultLevelPolicy implements LevelPolicy {

	private final int xpPerLevel;

	public DefaultLevelPolicy(@Value("${app.learning.level.xp-per-level:100}") int xpPerLevel) {
		this.xpPerLevel = xpPerLevel > 0 ? xpPerLevel : 100;
	}

	@Override
	public int calculateLevel(int totalXp) {
		int safeXp = Math.max(0, totalXp);
		int level = 1;

		level = (safeXp / xpPerLevel) + 1;

		return level;
	}

	@Override
	public int getXpForCurrentLevel(int currentLevel) {
		int safeLevel = Math.max(1, currentLevel);
		int xp = 0;

		xp = (safeLevel - 1) * xpPerLevel;

		return xp;
	}

	@Override
	public int getXpForNextLevel(int currentLevel) {
		int safeLevel = Math.max(1, currentLevel);
		int xp = 0;

		xp = safeLevel * xpPerLevel;

		return xp;
	}

	@Override
	public boolean isLevelUp(int oldXp, int newXp) {
		int oldLevel = calculateLevel(oldXp);
		int newLevel = calculateLevel(newXp);
		boolean result = false;

		result = newLevel > oldLevel;

		return result;
	}
}
