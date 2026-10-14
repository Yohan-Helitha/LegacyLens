package lk.ac.sliit.legacylens.learning.review;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.learning.dto.*;
import lk.ac.sliit.legacylens.learning.entity.Flashcard;
import lk.ac.sliit.legacylens.learning.entity.QuizQuestion;
import lk.ac.sliit.legacylens.learning.entity.UserWeakWord;
import lk.ac.sliit.legacylens.learning.repository.FlashcardRepository;
import lk.ac.sliit.legacylens.learning.repository.QuizQuestionRepository;
import lk.ac.sliit.legacylens.learning.repository.UserWeakWordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WeakWordReviewService {

	private static final Logger log = LoggerFactory.getLogger(WeakWordReviewService.class);

	private final UserWeakWordRepository userWeakWordRepository;
	private final FlashcardRepository flashcardRepository;
	private final QuizQuestionRepository quizQuestionRepository;
	private final ReviewScheduler reviewScheduler;
	private final Clock clock;
	private final int masteryStreakThreshold;
	private final ZoneId zoneId;

	private final Map<String, Map<String, ReviewQuestionMeta>> sessionCache = new ConcurrentHashMap<>();

	public WeakWordReviewService(
			UserWeakWordRepository userWeakWordRepository,
			FlashcardRepository flashcardRepository,
			QuizQuestionRepository quizQuestionRepository,
			ReviewScheduler reviewScheduler,
			Clock clock,
			@Value("${app.learning.review.mastery-streak:3}") int masteryStreakThreshold,
			@Value("${app.learning.timezone:Asia/Colombo}") String timezone) {
		this.userWeakWordRepository = userWeakWordRepository;
		this.flashcardRepository = flashcardRepository;
		this.quizQuestionRepository = quizQuestionRepository;
		this.reviewScheduler = reviewScheduler;
		this.clock = clock;
		this.masteryStreakThreshold = masteryStreakThreshold;
		this.zoneId = ZoneId.of(timezone);
	}

	@Transactional
	public void recordWrongAnswer(UUID userId, Long flashcardId) {
		LocalDateTime now = LocalDateTime.now(clock.withZone(zoneId));
		LocalDateTime nextReviewAt = now.plusDays(1);
		int rowsUpdated = 0;

		rowsUpdated = userWeakWordRepository.recordFailureAtomic(userId, flashcardId, now, nextReviewAt);
		if (rowsUpdated > 0) {
			return;
		}

		Flashcard flashcard = flashcardRepository.findById(flashcardId)
				.orElseThrow(() -> new ResourceNotFoundException("Flashcard not found"));

		UserWeakWord weakWord = new UserWeakWord();
		weakWord.setUserId(userId);
		weakWord.setFlashcard(flashcard);
		weakWord.setErrorCount(1);
		weakWord.setConsecutiveCorrect(0);
		weakWord.setLastFailedAt(now);
		weakWord.setMastered(false);
		weakWord.setBox(1);
		weakWord.setNextReviewAt(nextReviewAt);

		try {
			userWeakWordRepository.save(weakWord);
		} catch (DataIntegrityViolationException ex) {
			log.info("Concurrent insert race for user {} and flashcard {}, applying atomic update", userId, flashcardId);
			userWeakWordRepository.recordFailureAtomic(userId, flashcardId, now, nextReviewAt);
		}
	}

	@Transactional
	public void recordCorrectAnswer(UUID userId, Long flashcardId) {
		Optional<UserWeakWord> existingOpt = userWeakWordRepository.findByUserIdAndFlashcardId(userId, flashcardId);
		LocalDateTime now = LocalDateTime.now(clock.withZone(zoneId));
		int currentBox = 1;
		int daysToAdd = 1;
		LocalDateTime nextReviewAt = null;

		if (existingOpt.isEmpty()) {
			return;
		}

		UserWeakWord existing = existingOpt.get();
		currentBox = existing.getBox() == null ? 1 : existing.getBox();
		daysToAdd = calculateSpacedRepetitionDays(currentBox + 1);
		nextReviewAt = now.plusDays(daysToAdd);

		userWeakWordRepository.recordSuccessAtomic(userId, flashcardId, masteryStreakThreshold, nextReviewAt);
	}

	public List<WeakWordSummaryResponse> getMyWeakWords(UUID userId) {
		List<UserWeakWord> weakWords = userWeakWordRepository.findByUserIdOrderByErrorCountDesc(userId);
		List<WeakWordSummaryResponse> responses = new ArrayList<>();

		for (UserWeakWord word : weakWords) {
			Flashcard fc = word.getFlashcard();
			WeakWordSummaryResponse dto = new WeakWordSummaryResponse(
					word.getId(),
					fc != null ? fc.getId() : null,
					fc != null ? fc.getWord() : "Unknown",
					fc != null ? fc.getMeaning() : "",
					fc != null ? fc.getCulturalNote() : "",
					fc != null ? fc.getAudioUrl() : null,
					word.getErrorCount(),
					word.getConsecutiveCorrect(),
					word.isMastered(),
					word.getLastFailedAt(),
					word.getNextReviewAt(),
					word.getBox()
			);

			responses.add(dto);
		}

		return responses;
	}

	public ReviewSessionResponse buildReviewSession(UUID userId, int limit) {
		int safeLimit = Math.min(15, Math.max(1, limit));
		List<UserWeakWord> selectedWords = reviewScheduler.selectWordsForReview(userId, safeLimit);
		String sessionId = UUID.randomUUID().toString();
		Map<String, ReviewQuestionMeta> metaMap = new HashMap<>();
		List<ReviewQuestionDto> questions = new ArrayList<>();
		List<Flashcard> allCards = flashcardRepository.findAll();

		for (int i = 0; i < selectedWords.size(); i++) {
			UserWeakWord weakWord = selectedWords.get(i);
			Flashcard targetCard = weakWord.getFlashcard();
			if (targetCard == null) {
				continue;
			}

			String questionId = "rev_q_" + (i + 1);
			List<QuizQuestion> existingQuestions = quizQuestionRepository.findByFlashcardId(targetCard.getId());
			ReviewQuestionDto qDto = null;
			ReviewQuestionMeta meta = null;

			if (!existingQuestions.isEmpty()) {
				QuizQuestion qq = existingQuestions.get(0);
				qDto = new ReviewQuestionDto(
						questionId,
						targetCard.getId(),
						targetCard.getWord(),
						qq.getQuestion(),
						qq.getOptionA(),
						qq.getOptionB(),
						qq.getOptionC(),
						qq.getOptionD()
				);
				meta = new ReviewQuestionMeta(
						questionId,
						targetCard.getId(),
						targetCard.getWord(),
						qq.getCorrectOption(),
						targetCard.getMeaning()
				);
			} else {
				List<String> distractorMeanings = allCards.stream()
						.filter(c -> !c.getId().equals(targetCard.getId()))
						.map(Flashcard::getMeaning)
						.filter(Objects::nonNull)
						.distinct()
						.limit(3)
						.toList();

				List<String> options = new ArrayList<>();
				options.add(targetCard.getMeaning());
				options.addAll(distractorMeanings);
				while (options.size() < 4) {
					options.add("Traditional heritage element (" + options.size() + ")");
				}
				Collections.shuffle(options);

				String correctOptionLetter = "A";
				if (targetCard.getMeaning().equalsIgnoreCase(options.get(0))) correctOptionLetter = "A";
				else if (targetCard.getMeaning().equalsIgnoreCase(options.get(1))) correctOptionLetter = "B";
				else if (targetCard.getMeaning().equalsIgnoreCase(options.get(2))) correctOptionLetter = "C";
				else if (targetCard.getMeaning().equalsIgnoreCase(options.get(3))) correctOptionLetter = "D";

				qDto = new ReviewQuestionDto(
						questionId,
						targetCard.getId(),
						targetCard.getWord(),
						"What is the meaning of the heritage term '" + targetCard.getWord() + "'?",
						options.get(0),
						options.get(1),
						options.get(2),
						options.get(3)
				);
				meta = new ReviewQuestionMeta(
						questionId,
						targetCard.getId(),
						targetCard.getWord(),
						correctOptionLetter,
						targetCard.getMeaning()
				);
			}

			questions.add(qDto);
			metaMap.put(questionId, meta);
		}

		sessionCache.put(sessionId, metaMap);

		ReviewSessionResponse response = new ReviewSessionResponse(
				sessionId,
				questions.size(),
				reviewScheduler.getStrategyName(),
				questions
		);

		return response;
	}

	@Transactional
	public ReviewResultResponse submitReviewAnswers(UUID userId, SubmitReviewAnswersRequest request) {
		Map<String, ReviewQuestionMeta> metaMap = request.getSessionId() != null
				? sessionCache.getOrDefault(request.getSessionId(), Collections.emptyMap())
				: Collections.emptyMap();
		List<ReviewResultResponse.ReviewAnswerResultDto> resultList = new ArrayList<>();
		List<String> newlyMasteredWords = new ArrayList<>();
		int correctCount = 0;
		int totalQuestions = request.getAnswers().size();

		for (SubmitReviewAnswersRequest.ReviewAnswerItem ans : request.getAnswers()) {
			ReviewQuestionMeta meta = metaMap.get(ans.getQuestionId());
			Long flashcardId = ans.getFlashcardId();
			String correctOption = meta != null ? meta.getCorrectOption() : "A";
			String word = meta != null ? meta.getWord() : "Heritage word";
			String meaning = meta != null ? meta.getMeaning() : "";

			boolean isCorrect = ans.getSelectedOption() != null
					&& ans.getSelectedOption().trim().equalsIgnoreCase(correctOption.trim());

			if (isCorrect) {
				correctCount++;
				recordCorrectAnswer(userId, flashcardId);
			} else {
				recordWrongAnswer(userId, flashcardId);
			}

			Optional<UserWeakWord> updatedWeakWord = userWeakWordRepository.findByUserIdAndFlashcardId(userId, flashcardId);
			int consecutive = updatedWeakWord.map(UserWeakWord::getConsecutiveCorrect).orElse(0);
			boolean mastered = updatedWeakWord.map(UserWeakWord::isMastered).orElse(false);

			if (isCorrect && mastered) {
				newlyMasteredWords.add(word);
			}

			ReviewResultResponse.ReviewAnswerResultDto resultDto = new ReviewResultResponse.ReviewAnswerResultDto(
					ans.getQuestionId(),
					flashcardId,
					word,
					isCorrect,
					ans.getSelectedOption(),
					correctOption,
					meaning,
					consecutive,
					mastered
			);

			resultList.add(resultDto);
		}

		if (request.getSessionId() != null) {
			sessionCache.remove(request.getSessionId());
		}

		int percentage = totalQuestions > 0 ? (int) Math.round((correctCount * 100.0) / totalQuestions) : 0;
		int xpEarned = correctCount * 5;

		ReviewResultResponse response = new ReviewResultResponse(
				totalQuestions,
				correctCount,
				percentage,
				xpEarned,
				newlyMasteredWords.size(),
				newlyMasteredWords,
				resultList
		);

		return response;
	}

	private int calculateSpacedRepetitionDays(int box) {
		int days = 1;

		switch (box) {
			case 1:
				days = 1;
				break;
			case 2:
				days = 3;
				break;
			case 3:
				days = 7;
				break;
			case 4:
				days = 14;
				break;
			default:
				days = 30;
				break;
		}

		return days;
	}

	private static class ReviewQuestionMeta {
		private final String questionId;
		private final Long flashcardId;
		private final String word;
		private final String correctOption;
		private final String meaning;

		public ReviewQuestionMeta(
				String questionId,
				Long flashcardId,
				String word,
				String correctOption,
				String meaning) {
			this.questionId = questionId;
			this.flashcardId = flashcardId;
			this.word = word;
			this.correctOption = correctOption;
			this.meaning = meaning;
		}

		public String getQuestionId() {
			return questionId;
		}

		public Long getFlashcardId() {
			return flashcardId;
		}

		public String getWord() {
			return word;
		}

		public String getCorrectOption() {
			return correctOption;
		}

		public String getMeaning() {
			return meaning;
		}
	}
}
