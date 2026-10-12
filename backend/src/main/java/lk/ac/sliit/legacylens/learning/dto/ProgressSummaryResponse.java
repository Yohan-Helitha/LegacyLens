package lk.ac.sliit.legacylens.learning.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressSummaryResponse {

	private int totalXp;
	private int level;
	private int xpForCurrentLevel;
	private int xpForNextLevel;
	private int xpToNextLevel;
	private int currentStreakDays;
	private List<Boolean> last7Days;
	private long completedLessons;
	private long completedTracks;
	private boolean levelUp;
}
