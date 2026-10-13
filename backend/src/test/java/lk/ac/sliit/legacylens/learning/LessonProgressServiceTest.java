package lk.ac.sliit.legacylens.learning;

import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import lk.ac.sliit.legacylens.learning.progress.DefaultXpPolicy;
import lk.ac.sliit.legacylens.learning.progress.StreakCalculator;
import lk.ac.sliit.legacylens.learning.progress.XpPolicy;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonProgressRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonRepository;
import lk.ac.sliit.legacylens.learning.service.LessonProgressService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LessonProgressServiceTest {

	@Mock
	private LessonProgressRepository lessonProgressRepository;

	@Mock
	private LessonRepository lessonRepository;

	@Mock
	private LearningTrackRepository learningTrackRepository;

	private XpPolicy xpPolicy;
	private StreakCalculator streakCalculator;
	private Clock clock;
	private LessonProgressService lessonProgressService;

	private final UUID userId = UUID.randomUUID();
	private final Long lessonId = 101L;

	@BeforeEach
	void setUp() {
		xpPolicy = new DefaultXpPolicy(60);
		clock = Clock.fixed(Instant.parse("2026-10-15T12:00:00Z"), ZoneId.of("Asia/Colombo"));
		streakCalculator = new StreakCalculator(clock, "Asia/Colombo");
		lessonProgressService = new LessonProgressService(
				lessonProgressRepository,
				lessonRepository,
				learningTrackRepository,
				xpPolicy,
				streakCalculator,
				clock
		);
	}

	@Test
	@DisplayName("Completes flashcard lesson with server-calculated 20 XP")
	void testCompleteFlashcardLesson() {
		Lesson lesson = new Lesson();
		lesson.setId(lessonId);
		LessonProgress savedProgress = null;

		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.empty());
		when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

		savedProgress = lessonProgressService.completeFlashcardLesson(userId, lessonId);

		assertNotNull(savedProgress);
		assertTrue(savedProgress.isCompleted());
		assertEquals(20, savedProgress.getXpEarned());
		assertEquals(100, savedProgress.getScore());
		assertNotNull(savedProgress.getCompletedAt());
	}

	@Test
	@DisplayName("Completes quiz lesson when passing score is achieved")
	void testCompleteQuizLessonPassed() {
		Lesson lesson = new Lesson();
		lesson.setId(lessonId);
		LessonProgress savedProgress = null;

		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.empty());
		when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

		// 3 correct out of 4 is 75% -> passed -> 3 * 10 + 20 = 50 XP
		savedProgress = lessonProgressService.completeQuizLessonServerGraded(userId, lessonId, 3, 4);

		assertNotNull(savedProgress);
		assertTrue(savedProgress.isCompleted());
		assertEquals(50, savedProgress.getXpEarned());
		assertEquals(3, savedProgress.getScore());
		assertNotNull(savedProgress.getCompletedAt());
	}

	@Test
	@DisplayName("Fails quiz lesson when score is below 50% without bonus XP or completion timestamp")
	void testCompleteQuizLessonFailed() {
		Lesson lesson = new Lesson();
		lesson.setId(lessonId);
		LessonProgress savedProgress = null;

		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.empty());
		when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

		// 1 correct out of 4 is 25% -> failed -> 1 * 10 + 0 = 10 XP
		savedProgress = lessonProgressService.completeQuizLessonServerGraded(userId, lessonId, 1, 4);

		assertNotNull(savedProgress);
		assertFalse(savedProgress.isCompleted());
		assertEquals(10, savedProgress.getXpEarned());
		assertNull(savedProgress.getCompletedAt());
	}

	@Test
	@DisplayName("Does not award duplicate XP when lesson was already completed")
	void testDoNotDuplicateCompletedLessonXp() {
		Lesson lesson = new Lesson();
		lesson.setId(lessonId);
		LessonProgress existing = new LessonProgress();
		existing.setCompleted(true);
		existing.setXpEarned(20);
		LessonProgress result = null;

		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(existing));

		result = lessonProgressService.completeFlashcardLesson(userId, lessonId);

		assertEquals(existing, result);
		verify(lessonProgressRepository, never()).save(any(LessonProgress.class));
	}
}
