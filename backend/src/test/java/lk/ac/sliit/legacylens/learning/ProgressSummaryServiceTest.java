package lk.ac.sliit.legacylens.learning;

import lk.ac.sliit.legacylens.learning.dto.ProgressSummaryResponse;
import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import lk.ac.sliit.legacylens.learning.progress.DefaultLevelPolicy;
import lk.ac.sliit.legacylens.learning.progress.LevelPolicy;
import lk.ac.sliit.legacylens.learning.progress.ProgressSummaryService;
import lk.ac.sliit.legacylens.learning.progress.StreakCalculator;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProgressSummaryServiceTest {

	@Mock
	private LessonProgressRepository lessonProgressRepository;

	@Mock
	private LearningTrackRepository learningTrackRepository;

	private LevelPolicy levelPolicy;
	private StreakCalculator streakCalculator;
	private Clock clock;
	private ProgressSummaryService progressSummaryService;

	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		levelPolicy = new DefaultLevelPolicy(100);
		clock = Clock.fixed(Instant.parse("2026-10-15T10:00:00Z"), ZoneId.of("Asia/Colombo"));
		streakCalculator = new StreakCalculator(clock, "Asia/Colombo");
		progressSummaryService = new ProgressSummaryService(
				lessonProgressRepository,
				learningTrackRepository,
				levelPolicy,
				streakCalculator
		);
	}

	@Test
	@DisplayName("Builds comprehensive progress summary with correct level and streak")
	void testGetProgressSummary() {
		LessonProgress progress1 = new LessonProgress();
		Lesson lesson1 = new Lesson();
		lesson1.setId(1L);
		progress1.setLesson(lesson1);
		progress1.setCompleted(true);
		progress1.setXpEarned(60);
		progress1.setCompletedAt(LocalDateTime.of(2026, 10, 15, 9, 0));

		LessonProgress progress2 = new LessonProgress();
		Lesson lesson2 = new Lesson();
		lesson2.setId(2L);
		progress2.setLesson(lesson2);
		progress2.setCompleted(true);
		progress2.setXpEarned(50);
		progress2.setCompletedAt(LocalDateTime.of(2026, 10, 14, 9, 0));

		ProgressSummaryResponse summary = null;

		when(lessonProgressRepository.sumXpByUserId(userId)).thenReturn(110L);
		when(lessonProgressRepository.countByUserIdAndCompletedTrue(userId)).thenReturn(2L);
		when(learningTrackRepository.countCompletedTracks(userId)).thenReturn(1L);
		when(lessonProgressRepository.findByUserId(userId)).thenReturn(List.of(progress1, progress2));

		summary = progressSummaryService.getProgressSummary(userId, 80);

		assertNotNull(summary);
		assertEquals(110, summary.getTotalXp());
		assertEquals(2, summary.getLevel()); // 110 XP -> Level 2
		assertEquals(100, summary.getXpForCurrentLevel());
		assertEquals(200, summary.getXpForNextLevel());
		assertEquals(90, summary.getXpToNextLevel());
		assertEquals(2, summary.getCurrentStreakDays());
		assertEquals(2, summary.getCompletedLessons());
		assertEquals(1, summary.getCompletedTracks());
		assertTrue(summary.isLevelUp()); // Previous was 80 (Level 1) -> now 110 (Level 2)
	}
}
