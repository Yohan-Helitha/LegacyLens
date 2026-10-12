package lk.ac.sliit.legacylens.learning.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.learning.ai.dto.StudyAttemptResultResponse;
import lk.ac.sliit.legacylens.learning.ai.dto.SubmitStudyAttemptRequest;
import lk.ac.sliit.legacylens.learning.ai.job.GenerationJob;
import lk.ac.sliit.legacylens.learning.ai.job.GenerationJobRepository;
import lk.ac.sliit.legacylens.learning.ai.job.JobStatus;
import lk.ac.sliit.legacylens.learning.ai.service.StudySetService;
import lk.ac.sliit.legacylens.learning.entity.*;
import lk.ac.sliit.legacylens.learning.progress.DefaultXpPolicy;
import lk.ac.sliit.legacylens.learning.progress.XpPolicy;
import lk.ac.sliit.legacylens.learning.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class StudySetServiceTest {

	private GenerationJobRepository jobRepository;
	private LearningTrackRepository trackRepository;
	private LessonRepository lessonRepository;
	private FlashcardRepository flashcardRepository;
	private QuizQuestionRepository quizQuestionRepository;
	private StudySetAttemptRepository attemptRepository;
	private LessonProgressRepository progressRepository;
	private lk.ac.sliit.legacylens.learning.review.WeakWordReviewService weakWordReviewService;
	private XpPolicy xpPolicy;
	private ObjectMapper objectMapper;
	private Clock fixedClock;
	private StudySetService service;

	private final UUID userId = UUID.randomUUID();
	private final UUID otherUserId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		jobRepository = mock(GenerationJobRepository.class);
		trackRepository = mock(LearningTrackRepository.class);
		lessonRepository = mock(LessonRepository.class);
		flashcardRepository = mock(FlashcardRepository.class);
		quizQuestionRepository = mock(QuizQuestionRepository.class);
		attemptRepository = mock(StudySetAttemptRepository.class);
		progressRepository = mock(LessonProgressRepository.class);
		weakWordReviewService = mock(lk.ac.sliit.legacylens.learning.review.WeakWordReviewService.class);
		xpPolicy = new DefaultXpPolicy(60);
		objectMapper = new ObjectMapper();
		fixedClock = Clock.fixed(Instant.parse("2026-10-12T10:00:00Z"), ZoneId.of("Asia/Colombo"));

		service = new StudySetService(
				jobRepository,
				trackRepository,
				lessonRepository,
				flashcardRepository,
				quizQuestionRepository,
				attemptRepository,
				progressRepository,
				weakWordReviewService,
				xpPolicy,
				objectMapper,
				fixedClock,
				"Asia/Colombo"
		);
	}

	@Test
	@DisplayName("Saves generated study set creating track, flashcards, quiz questions and linking them")
	void testSaveStudySet() {
		String json = """
			{
			  "courseTitle": "Galle Fort Lace",
			  "courseDescription": "Traditional lace craft",
			  "region": "Galle",
			  "occupation": "Lace maker",
			  "flashcards": [
			    { "word": "bobbin", "meaning": "Spool tool", "sourceContentId": "s1", "evidence": "wooden bobbins" }
			  ],
			  "quizQuestions": [
			    {
			      "question": "What is bobbin?",
			      "optionA": "tool",
			      "optionB": "fabric",
			      "optionC": "tree",
			      "optionD": "clay",
			      "correctOption": "A",
			      "flashcardWord": "bobbin",
			      "sourceContentId": "s1",
			      "evidence": "wooden bobbins"
			    }
			  ]
			}
			""";

		GenerationJob job = new GenerationJob();
		job.setId(50L);
		job.setOwnerUserId(userId);
		job.setStatus(JobStatus.SUCCEEDED);
		job.setGeneratedJson(json);
		job.setSourceContentIds("s1");

		when(jobRepository.findByIdAndOwnerUserId(50L, userId)).thenReturn(Optional.of(job));
		when(trackRepository.save(any(LearningTrack.class))).thenAnswer(inv -> {
			LearningTrack t = inv.getArgument(0);
			t.setId(100L);
			return t;
		});
		when(lessonRepository.save(any(Lesson.class))).thenAnswer(inv -> {
			Lesson l = inv.getArgument(0);
			l.setId(200L);
			return l;
		});
		when(flashcardRepository.save(any(Flashcard.class))).thenAnswer(inv -> {
			Flashcard f = inv.getArgument(0);
			f.setId(300L);
			return f;
		});
		when(quizQuestionRepository.save(any(QuizQuestion.class))).thenAnswer(inv -> {
			QuizQuestion q = inv.getArgument(0);
			q.setId(400L);
			return q;
		});

		Long savedTrackId = service.saveStudySet(userId, 50L);

		assertEquals(100L, savedTrackId);
		assertEquals(100L, job.getResultTrackId());
		verify(trackRepository, atLeastOnce()).save(any(LearningTrack.class));
		verify(flashcardRepository, times(1)).save(any(Flashcard.class));
		verify(quizQuestionRepository, times(1)).save(any(QuizQuestion.class));
	}

	@Test
	@DisplayName("First quiz attempt on an AI set awards XP under the daily cap")
	void testFirstAttemptAwardsXp() {
		Long trackId = 100L;
		Long lessonId = 200L;

		LearningTrack track = new LearningTrack();
		track.setId(trackId);
		track.setOwnerUserId(userId);

		Lesson lesson = new Lesson();
		lesson.setId(lessonId);
		lesson.setTrack(track);

		QuizQuestion q1 = new QuizQuestion();
		q1.setId(1L);
		q1.setCorrectOption("A");

		QuizQuestion q2 = new QuizQuestion();
		q2.setId(2L);
		q2.setCorrectOption("B");

		when(trackRepository.findByIdAndOwnerUserId(trackId, userId)).thenReturn(Optional.of(track));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(quizQuestionRepository.findByLessonIdOrderByIdAsc(lessonId)).thenReturn(List.of(q1, q2));
		when(attemptRepository.existsByOwnerUserIdAndTrackId(userId, trackId)).thenReturn(false);
		when(attemptRepository.findByOwnerUserIdOrderByTakenAtDesc(userId)).thenReturn(List.of());
		when(attemptRepository.save(any(StudySetAttempt.class))).thenAnswer(inv -> {
			StudySetAttempt a = inv.getArgument(0);
			a.setId(999L);
			return a;
		});

		SubmitStudyAttemptRequest req = new SubmitStudyAttemptRequest(lessonId, List.of(
				new SubmitStudyAttemptRequest.QuizAnswerItem(1L, "A"),
				new SubmitStudyAttemptRequest.QuizAnswerItem(2L, "B")
		));

		StudyAttemptResultResponse result = service.submitQuizAttempt(userId, trackId, req);

		assertTrue(result.isFirstAttempt());
		assertEquals(2, result.getScore());
		assertEquals(2, result.getTotal());
		assertTrue(result.isPassed());
		// 2 correct (20) + completion bonus (20) = 40 XP
		assertEquals(40, result.getXpAwarded());
		verify(progressRepository, times(1)).save(any(LessonProgress.class));
	}

	@Test
	@DisplayName("Subsequent quiz retake awards 0 XP to prevent XP farming")
	void testRetakeAwardsZeroXp() {
		Long trackId = 100L;
		Long lessonId = 200L;

		LearningTrack track = new LearningTrack();
		track.setId(trackId);
		track.setOwnerUserId(userId);

		Lesson lesson = new Lesson();
		lesson.setId(lessonId);
		lesson.setTrack(track);

		QuizQuestion q1 = new QuizQuestion();
		q1.setId(1L);
		q1.setCorrectOption("A");

		when(trackRepository.findByIdAndOwnerUserId(trackId, userId)).thenReturn(Optional.of(track));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(quizQuestionRepository.findByLessonIdOrderByIdAsc(lessonId)).thenReturn(List.of(q1));
		// Already attempted previously!
		when(attemptRepository.existsByOwnerUserIdAndTrackId(userId, trackId)).thenReturn(true);
		when(attemptRepository.save(any(StudySetAttempt.class))).thenAnswer(inv -> {
			StudySetAttempt a = inv.getArgument(0);
			a.setId(1001L);
			return a;
		});

		SubmitStudyAttemptRequest req = new SubmitStudyAttemptRequest(lessonId, List.of(
				new SubmitStudyAttemptRequest.QuizAnswerItem(1L, "A")
		));

		StudyAttemptResultResponse result = service.submitQuizAttempt(userId, trackId, req);

		assertFalse(result.isFirstAttempt());
		assertEquals(1, result.getScore());
		assertEquals(0, result.getXpAwarded());
		verify(progressRepository, never()).save(any(LessonProgress.class));
	}

	@Test
	@DisplayName("Prevents unauthorized access to another user's private study set (read, delete, or retake)")
	void testUnauthorizedAccessBlocked() {
		when(trackRepository.findByIdAndOwnerUserId(500L, otherUserId)).thenReturn(Optional.empty());

		assertThrows(ResponseStatusException.class, () -> service.getMyStudySetDetail(otherUserId, 500L));
		assertThrows(ResponseStatusException.class, () -> service.deleteMyStudySet(otherUserId, 500L));

		SubmitStudyAttemptRequest req = new SubmitStudyAttemptRequest(1L, List.of());
		assertThrows(ResponseStatusException.class, () -> service.submitQuizAttempt(otherUserId, 500L, req));
	}

	@Test
	@DisplayName("Saved AI study sets are marked with origin 'AI' and visibility 'PRIVATE'")
	void testSavedAiSetHasPrivateVisibility() {
		String json = """
			{
			  "courseTitle": "Private AI Course",
			  "flashcards": []
			}
			""";

		GenerationJob job = new GenerationJob();
		job.setId(60L);
		job.setOwnerUserId(userId);
		job.setStatus(JobStatus.SUCCEEDED);
		job.setGeneratedJson(json);

		when(jobRepository.findByIdAndOwnerUserId(60L, userId)).thenReturn(Optional.of(job));
		when(trackRepository.save(any(LearningTrack.class))).thenAnswer(inv -> inv.getArgument(0));

		service.saveStudySet(userId, 60L);

		verify(trackRepository, atLeastOnce()).save(argThat(track ->
				"AI".equals(track.getOrigin()) &&
				"PRIVATE".equals(track.getVisibility()) &&
				userId.equals(track.getOwnerUserId())
		));
	}
}
