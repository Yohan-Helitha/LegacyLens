package lk.ac.sliit.legacylens.learning.progress;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class StreakCalculator {

	private final Clock clock;
	private final ZoneId zoneId;

	public StreakCalculator(
			Clock clock,
			@Value("${app.learning.timezone:Asia/Colombo}") String timezone) {
		this.clock = clock;
		this.zoneId = ZoneId.of(timezone);
	}

	public int calculateCurrentStreak(Set<LocalDate> activeDates) {
		LocalDate today = LocalDate.now(clock.withZone(zoneId));
		int streak = 0;
		LocalDate checkDate = today;

		if (activeDates == null || activeDates.isEmpty()) {
			return 0;
		}

		if (!activeDates.contains(today)) {
			checkDate = today.minusDays(1);
		}

		while (activeDates.contains(checkDate)) {
			streak++;
			checkDate = checkDate.minusDays(1);
		}

		return streak;
	}

	public List<Boolean> calculateLast7Days(Set<LocalDate> activeDates) {
		LocalDate today = LocalDate.now(clock.withZone(zoneId));
		LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
		List<Boolean> weekActivity = new ArrayList<>(7);
		int dayIndex = 0;

		for (dayIndex = 0; dayIndex < 7; dayIndex++) {
			LocalDate day = monday.plusDays(dayIndex);
			boolean completed = activeDates != null && activeDates.contains(day);
			weekActivity.add(completed);
		}

		return weekActivity;
	}
}
