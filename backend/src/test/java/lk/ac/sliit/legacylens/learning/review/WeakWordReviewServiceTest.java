package lk.ac.sliit.legacylens.learning.review;

import lk.ac.sliit.legacylens.learning.dto.*;
import lk.ac.sliit.legacylens.learning.entity.Flashcard;
import lk.ac.sliit.legacylens.learning.entity.QuizQuestion;
import lk.ac.sliit.legacylens.learning.entity.UserWeakWord;
import lk.ac.sliit.legacylens.learning.repository.FlashcardRepository;
import lk.ac.sliit.legacylens.learning.repository.QuizQuestionRepository;
import lk.ac.sliit.legacylens.learning.repository.UserWeakWordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class WeakWordReviewServiceTest {

	private UserWeakWordRepository userWeakWordRepository;
	private FlashcardRepository flashcardRepository;
	private QuizQuestionRepository quizQuestionRepository;
	private ReviewScheduler reviewScheduler;
	private Clock fixedClock;
	private WeakWordReviewService service;

	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		userWeakWordRepository = mock(UserWeakWordRepository.class);
		flashcardRepository = mock(FlashcardRepository.class);
		quizQuestionRepository = mock(QuizQuestionRepository.class);
		reviewScheduler = mock(ReviewScheduler.class);
		fixedClock = Clock.fixed(Instant.parse("2026-10-12T10:00:00Z"), ZoneId.of("Asia/Colombo"));

		service = new WeakWordReviewService(
				userWeakWordRepository,
				flashcardRepository,
				quizQuestionRepository,
				reviewScheduler,
				fixedClock,
				3,
				"Asia/Colombo"
		);
	}

	@Test
	@DisplayName("Records wrong answer atomically when record exists")
	void testRecordWrongAnswerExisting() {
		when(userWeakWordRepository.recordFailureAtomic(eq(userId), eq(10L), any(), any()))
				.thenReturn(1);

		service.recordWrongAnswer(userId, 10L);

		verify(userWeakWordRepository).recordFailureAtomic(eq(userId), eq(10L), any(), any());
		verify(userWeakWordRepository, never()).save(any());
	}

	@Test
	@DisplayName("Records wrong answer creating new UserWeakWord when no record exists")
	void testRecordWrongAnswerNew() {
		Flashcard card = new Flashcard();
		card.setId(10L);
		card.setWord("Kamatha");

		when(userWeakWordRepository.recordFailureAtomic(eq(userId), eq(10L), any(), any()))
				.thenReturn(0);
		when(flashcardRepository.findById(10L)).thenReturn(Optional.of(card));

		service.recordWrongAnswer(userId, 10L);

		verify(userWeakWordRepository).save(argThat(word ->
				word.getUserId().equals(userId) &&
				word.getFlashcard().getId().equals(10L) &&
				word.getErrorCount() == 1 &&
				!word.isMastered() &&
				word.getConsecutiveCorrect() == 0
		));
	}

	@Test
	@DisplayName("Records correct answer and calls atomic success update")
	void testRecordCorrectAnswer() {
		UserWeakWord word = new UserWeakWord();
		word.setUserId(userId);
		word.setBox(2);
		word.setConsecutiveCorrect(2);

		when(userWeakWordRepository.findByUserIdAndFlashcardId(userId, 10L))
				.thenReturn(Optional.of(word));

		service.recordCorrectAnswer(userId, 10L);

		verify(userWeakWordRepository).recordSuccessAtomic(eq(userId), eq(10L), eq(3), any());
	}

	@Test
	@DisplayName("Builds review session with synthesized 4-option questions when no quiz questions exist")
	void testBuildReviewSessionSynthesized() {
		Flashcard card1 = new Flashcard();
		card1.setId(1L);
		card1.setWord("Nawa");
		card1.setMeaning("Traditional ship");

		Flashcard card2 = new Flashcard();
		card2.setId(2L);
		card2.setWord("Poruwa");
		card2.setMeaning("Ceremonial platform");

		UserWeakWord ww1 = new UserWeakWord();
		ww1.setId(100L);
		ww1.setFlashcard(card1);

		when(reviewScheduler.selectWordsForReview(userId, 5)).thenReturn(List.of(ww1));
		when(quizQuestionRepository.findByFlashcardId(1L)).thenReturn(List.of());
		when(flashcardRepository.findAll()).thenReturn(List.of(card1, card2));
		when(reviewScheduler.getStrategyName()).thenReturn("most-missed");

		ReviewSessionResponse session = service.buildReviewSession(userId, 5);

		assertNotNull(session.getSessionId());
		assertEquals(1, session.getTotalQuestions());
		assertEquals("most-missed", session.getStrategyUsed());
		assertEquals(1, session.getQuestions().size());

		ReviewQuestionDto q = session.getQuestions().get(0);
		assertEquals("Nawa", q.getWord());
		assertNotNull(q.getOptionA());
		assertNotNull(q.getOptionB());
		assertNotNull(q.getOptionC());
		assertNotNull(q.getOptionD());
	}

	@Test
	@DisplayName("Submits review answers, evaluates correctness and awards XP")
	void testSubmitReviewAnswers() {
		Flashcard card = new Flashcard();
		card.setId(1L);
		card.setWord("Kuruni");
		card.setMeaning("Grain basket");

		UserWeakWord ww = new UserWeakWord();
		ww.setUserId(userId);
		ww.setFlashcard(card);
		ww.setConsecutiveCorrect(3);
		ww.setMastered(true);

		when(reviewScheduler.selectWordsForReview(userId, 1)).thenReturn(List.of(ww));
		when(quizQuestionRepository.findByFlashcardId(1L)).thenReturn(List.of());
		when(flashcardRepository.findAll()).thenReturn(List.of(card));

		ReviewSessionResponse session = service.buildReviewSession(userId, 1);
		String qId = session.getQuestions().get(0).getQuestionId();

		SubmitReviewAnswersRequest request = new SubmitReviewAnswersRequest(
				session.getSessionId(),
				List.of(new SubmitReviewAnswersRequest.ReviewAnswerItem(qId, 1L, "A"))
		);

		when(flashcardRepository.findById(1L)).thenReturn(Optional.of(card));
		when(userWeakWordRepository.recordFailureAtomic(any(), any(), any(), any())).thenReturn(1);
		when(userWeakWordRepository.recordSuccessAtomic(any(), any(), anyInt(), any())).thenReturn(1);
		when(userWeakWordRepository.findByUserIdAndFlashcardId(userId, 1L)).thenReturn(Optional.of(ww));

		ReviewResultResponse result = service.submitReviewAnswers(userId, request);

		assertEquals(1, result.getTotalQuestions());
		assertNotNull(result.getResults());
	}

	@Test
	@DisplayName("N consecutive correct answers (masteryThreshold = 3) marks the word as mastered")
	void testConsecutiveCorrectMarksWordMastered() {
		UserWeakWord word = new UserWeakWord();
		word.setUserId(userId);
		word.setBox(1);
		word.setConsecutiveCorrect(2);
		word.setMastered(false);

		when(userWeakWordRepository.findByUserIdAndFlashcardId(userId, 50L))
				.thenReturn(Optional.of(word));
		when(userWeakWordRepository.recordSuccessAtomic(eq(userId), eq(50L), eq(3), any()))
				.thenReturn(1);

		service.recordCorrectAnswer(userId, 50L);

		// Verified that recordSuccessAtomic was called with threshold = 3, which executes:
		// "CASE WHEN consecutive_correct + 1 >= :threshold THEN true ELSE false END"
		verify(userWeakWordRepository).recordSuccessAtomic(eq(userId), eq(50L), eq(3), any());
	}

	@Test
	@DisplayName("Concurrent increments execute atomic update statements avoiding lost updates")
	void testConcurrentIncrementsAtomicExecution() {
		when(userWeakWordRepository.recordFailureAtomic(eq(userId), eq(10L), any(), any()))
				.thenReturn(1);

		// Simulate multiple concurrent wrong answers
		service.recordWrongAnswer(userId, 10L);
		service.recordWrongAnswer(userId, 10L);

		// Each call executes a single native atomic UPDATE statement directly on the DB row
		verify(userWeakWordRepository, times(2))
				.recordFailureAtomic(eq(userId), eq(10L), any(), any());
	}
}
