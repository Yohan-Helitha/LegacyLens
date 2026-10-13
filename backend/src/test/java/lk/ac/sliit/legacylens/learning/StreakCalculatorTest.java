package lk.ac.sliit.legacylens.learning;

import lk.ac.sliit.legacylens.learning.progress.StreakCalculator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class StreakCalculatorTest {

	private static final ZoneId COLOMBO_ZONE = ZoneId.of("Asia/Colombo");

	@Test
	@DisplayName("Calculates streak when user completed lessons today and preceding days")
	void testActiveStreakToday() {
		Instant fixedInstant = Instant.parse("2026-10-15T10:00:00Z");
		Clock fixedClock = Clock.fixed(fixedInstant, COLOMBO_ZONE);
		StreakCalculator calculator = new StreakCalculator(fixedClock, "Asia/Colombo");
		LocalDate today = LocalDate.now(fixedClock.withZone(COLOMBO_ZONE));
		Set<LocalDate> dates = new HashSet<>();
		int streak = 0;

		dates.add(today);
		dates.add(today.minusDays(1));
		dates.add(today.minusDays(2));
		streak = calculator.calculateCurrentStreak(dates);

		assertEquals(3, streak);
	}

	@Test
	@DisplayName("Preserves streak when user completed yesterday but has not completed today yet")
	void testPreservesStreakFromYesterday() {
		Instant fixedInstant = Instant.parse("2026-10-15T10:00:00Z");
		Clock fixedClock = Clock.fixed(fixedInstant, COLOMBO_ZONE);
		StreakCalculator calculator = new StreakCalculator(fixedClock, "Asia/Colombo");
		LocalDate today = LocalDate.now(fixedClock.withZone(COLOMBO_ZONE));
		Set<LocalDate> dates = new HashSet<>();
		int streak = 0;

		dates.add(today.minusDays(1));
		dates.add(today.minusDays(2));
		streak = calculator.calculateCurrentStreak(dates);

		assertEquals(2, streak);
	}

	@Test
	@DisplayName("Resets streak to zero when user missed both today and yesterday")
	void testResetsStreakWhenMissed() {
		Instant fixedInstant = Instant.parse("2026-10-15T10:00:00Z");
		Clock fixedClock = Clock.fixed(fixedInstant, COLOMBO_ZONE);
		StreakCalculator calculator = new StreakCalculator(fixedClock, "Asia/Colombo");
		LocalDate today = LocalDate.now(fixedClock.withZone(COLOMBO_ZONE));
		Set<LocalDate> dates = new HashSet<>();
		int streak = 0;

		dates.add(today.minusDays(2));
		streak = calculator.calculateCurrentStreak(dates);

		assertEquals(0, streak);
	}

	@Test
	@DisplayName("Accurately accounts for midnight rollover in Asia/Colombo time")
	void testStreakAcrossMidnightColombo() {
		// 18:35 UTC on Oct 14 is 00:05 AM Oct 15 in Asia/Colombo (+05:30)
		Instant instantJustAfterMidnight = Instant.parse("2026-10-14T18:35:00Z");
		Clock clock = Clock.fixed(instantJustAfterMidnight, COLOMBO_ZONE);
		StreakCalculator calculator = new StreakCalculator(clock, "Asia/Colombo");
		Set<LocalDate> dates = new HashSet<>();
		int streak = 0;

		dates.add(LocalDate.of(2026, 10, 15));
		dates.add(LocalDate.of(2026, 10, 14));
		streak = calculator.calculateCurrentStreak(dates);

		assertEquals(2, streak);
	}

	@Test
	@DisplayName("Returns 7 boolean values for weekly activity")
	void testWeeklyActivity() {
		Instant fixedInstant = Instant.parse("2026-10-15T10:00:00Z");
		Clock fixedClock = Clock.fixed(fixedInstant, COLOMBO_ZONE);
		StreakCalculator calculator = new StreakCalculator(fixedClock, "Asia/Colombo");
		LocalDate today = LocalDate.now(fixedClock.withZone(COLOMBO_ZONE));
		Set<LocalDate> dates = new HashSet<>();
		List<Boolean> last7Days = null;

		dates.add(today);
		last7Days = calculator.calculateLast7Days(dates);

		assertNotNull(last7Days);
		assertEquals(7, last7Days.size());
	}
}
