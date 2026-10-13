package lk.ac.sliit.legacylens.learning;

import lk.ac.sliit.legacylens.learning.progress.DefaultLevelPolicy;
import lk.ac.sliit.legacylens.learning.progress.LevelPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LevelPolicyTest {

	private LevelPolicy levelPolicy;

	@BeforeEach
	void setUp() {
		levelPolicy = new DefaultLevelPolicy(100);
	}

	@Test
	@DisplayName("Calculates correct level from total XP")
	void testCalculateLevel() {
		int level0 = 0;
		int level50 = 0;
		int level100 = 0;
		int level250 = 0;

		level0 = levelPolicy.calculateLevel(0);
		level50 = levelPolicy.calculateLevel(50);
		level100 = levelPolicy.calculateLevel(100);
		level250 = levelPolicy.calculateLevel(250);

		assertEquals(1, level0);
		assertEquals(1, level50);
		assertEquals(2, level100);
		assertEquals(3, level250);
	}

	@Test
	@DisplayName("Returns correct XP thresholds for current and next levels")
	void testLevelThresholds() {
		int currentBase = 0;
		int nextTarget = 0;

		currentBase = levelPolicy.getXpForCurrentLevel(2);
		nextTarget = levelPolicy.getXpForNextLevel(2);

		assertEquals(100, currentBase);
		assertEquals(200, nextTarget);
	}

	@Test
	@DisplayName("Detects level up across threshold boundary")
	void testIsLevelUp() {
		boolean leveledUp = false;
		boolean sameLevel = false;

		leveledUp = levelPolicy.isLevelUp(90, 110);
		sameLevel = levelPolicy.isLevelUp(110, 150);

		assertTrue(leveledUp);
		assertFalse(sameLevel);
	}
}
