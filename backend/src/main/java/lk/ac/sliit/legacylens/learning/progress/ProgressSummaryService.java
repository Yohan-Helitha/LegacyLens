package lk.ac.sliit.legacylens.learning.progress;

import lk.ac.sliit.legacylens.learning.dto.ProgressSummaryResponse;
import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonProgressRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProgressSummaryService {

	private final LessonProgressRepository lessonProgressRepository;
	private final LearningTrackRepository learningTrackRepository;
	private final LevelPolicy levelPolicy;
	private final StreakCalculator streakCalculator;

	public ProgressSummaryService(
			LessonProgressRepository lessonProgressRepository,
			LearningTrackRepository learningTrackRepository,
			LevelPolicy levelPolicy,
			StreakCalculator streakCalculator) {
		this.lessonProgressRepository = lessonProgressRepository;
		this.learningTrackRepository = learningTrackRepository;
		this.levelPolicy = levelPolicy;
		this.streakCalculator = streakCalculator;
	}

	public ProgressSummaryResponse getProgressSummary(UUID userId) {
		int currentXp = (int) lessonProgressRepository.sumXpByUserId(userId);

		ProgressSummaryResponse response = buildSummary(userId, currentXp, currentXp);

		return response;
	}

	public ProgressSummaryResponse getProgressSummary(UUID userId, int previousXp) {
		int currentXp = (int) lessonProgressRepository.sumXpByUserId(userId);

		ProgressSummaryResponse response = buildSummary(userId, currentXp, previousXp);

		return response;
	}

	private ProgressSummaryResponse buildSummary(UUID userId, int currentXp, int previousXp) {
		int level = levelPolicy.calculateLevel(currentXp);
		int currentLevelBaseXp = levelPolicy.getXpForCurrentLevel(level);
		int nextLevelTargetXp = levelPolicy.getXpForNextLevel(level);
		int xpToNext = Math.max(0, nextLevelTargetXp - currentXp);
		boolean levelUp = levelPolicy.isLevelUp(previousXp, currentXp);
		long completedLessons = lessonProgressRepository.countByUserIdAndCompletedTrue(userId);
		long completedTracks = learningTrackRepository.countCompletedTracks(userId);
		List<LessonProgress> progressList = lessonProgressRepository.findByUserId(userId);
		Set<LocalDate> activeDates = progressList.stream()
				.filter(LessonProgress::isCompleted)
				.map(LessonProgress::getCompletedAt)
				.filter(Objects::nonNull)
				.map(LocalDateTime::toLocalDate)
				.collect(Collectors.toSet());
		int currentStreak = streakCalculator.calculateCurrentStreak(activeDates);
		List<Boolean> last7Days = streakCalculator.calculateLast7Days(activeDates);

		ProgressSummaryResponse summary = ProgressSummaryResponse.builder()
				.totalXp(currentXp)
				.level(level)
				.xpForCurrentLevel(currentLevelBaseXp)
				.xpForNextLevel(nextLevelTargetXp)
				.xpToNextLevel(xpToNext)
				.currentStreakDays(currentStreak)
				.last7Days(last7Days)
				.completedLessons(completedLessons)
				.completedTracks(completedTracks)
				.levelUp(levelUp)
				.build();

		return summary;
	}
}
