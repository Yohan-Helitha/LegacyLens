package lk.ac.sliit.legacylens.learning.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.learning.ai.dto.*;
import lk.ac.sliit.legacylens.learning.ai.job.GenerationJob;
import lk.ac.sliit.legacylens.learning.ai.job.GenerationJobRepository;
import lk.ac.sliit.legacylens.learning.ai.job.JobStatus;
import lk.ac.sliit.legacylens.learning.ai.validation.GeneratedStudySet;
import lk.ac.sliit.legacylens.learning.entity.*;
import lk.ac.sliit.legacylens.learning.progress.XpPolicy;
import lk.ac.sliit.legacylens.learning.repository.*;
import lk.ac.sliit.legacylens.learning.review.WeakWordReviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class StudySetService {

	private static final Logger log = LoggerFactory.getLogger(StudySetService.class);

	private final GenerationJobRepository generationJobRepository;
	private final LearningTrackRepository learningTrackRepository;
	private final LessonRepository lessonRepository;
	private final FlashcardRepository flashcardRepository;
	private final QuizQuestionRepository quizQuestionRepository;
	private final StudySetAttemptRepository studySetAttemptRepository;
	private final LessonProgressRepository lessonProgressRepository;
	private final WeakWordReviewService weakWordReviewService;
	private final XpPolicy xpPolicy;
	private final ObjectMapper objectMapper;
	private final Clock clock;
	private final ZoneId zoneId;

	public StudySetService(
			GenerationJobRepository generationJobRepository,
			LearningTrackRepository learningTrackRepository,
			LessonRepository lessonRepository,
			FlashcardRepository flashcardRepository,
			QuizQuestionRepository quizQuestionRepository,
			StudySetAttemptRepository studySetAttemptRepository,
			LessonProgressRepository lessonProgressRepository,
			WeakWordReviewService weakWordReviewService,
			XpPolicy xpPolicy,
			ObjectMapper objectMapper,
			Clock clock,
			@Value("${app.learning.timezone:Asia/Colombo}") String timezone) {
		this.generationJobRepository = generationJobRepository;
		this.learningTrackRepository = learningTrackRepository;
		this.lessonRepository = lessonRepository;
		this.flashcardRepository = flashcardRepository;
		this.quizQuestionRepository = quizQuestionRepository;
		this.studySetAttemptRepository = studySetAttemptRepository;
		this.lessonProgressRepository = lessonProgressRepository;
		this.weakWordReviewService = weakWordReviewService;
		this.xpPolicy = xpPolicy;
		this.objectMapper = objectMapper;
		this.clock = clock;
		this.zoneId = ZoneId.of(timezone);
	}

	@Transactional
	public Long saveStudySet(UUID userId, Long jobId) {
		GenerationJob job = generationJobRepository.findByIdAndOwnerUserId(jobId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Generation job not found"));
		GeneratedStudySet studySet = null;
		LearningTrack track = null;
		LearningTrack savedTrack = null;
		Lesson flashcardLesson = null;
		Lesson quizLesson = null;
		Map<String, Flashcard> flashcardWordMap = new HashMap<>();
		int lessonOrderCounter = 1;

		if (job.getStatus() != JobStatus.SUCCEEDED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Generation job has not succeeded yet");
		}

		if (job.getResultTrackId() != null) {
			return job.getResultTrackId();
		}

		if (job.getGeneratedJson() == null || job.getGeneratedJson().isBlank()) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No generated content found in job");
		}

		try {
			studySet = objectMapper.readValue(job.getGeneratedJson(), GeneratedStudySet.class);
		} catch (Exception ex) {
			log.error("Failed to parse generated json for job {}: {}", jobId, ex.getMessage());
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse study set content");
		}

		track = new LearningTrack();
		track.setOrigin("AI");
		track.setOwnerUserId(userId);
		track.setVisibility("PRIVATE");
		track.setSourceContentIds(job.getSourceContentIds());
		track.setTitle(studySet.getCourseTitle() != null && !studySet.getCourseTitle().isBlank()
				? studySet.getCourseTitle()
				: "Community Heritage Study Set");
		track.setDescription(studySet.getCourseDescription());
		track.setRegion(studySet.getRegion());
		track.setOccupation(studySet.getOccupation());
		track.setTotalLessons(0);

		savedTrack = learningTrackRepository.save(track);

		if (studySet.getFlashcards() != null && !studySet.getFlashcards().isEmpty()) {
			flashcardLesson = new Lesson();
			flashcardLesson.setTrack(savedTrack);
			flashcardLesson.setTitle("Vocabulary & Cultural Terms");
			flashcardLesson.setDescription("Learn dialect and heritage terms discovered in community stories");
			flashcardLesson.setType("FLASHCARDS");
			flashcardLesson.setLessonOrder(lessonOrderCounter++);
			flashcardLesson = lessonRepository.save(flashcardLesson);

			for (GeneratedStudySet.GeneratedFlashcard gfc : studySet.getFlashcards()) {
				Flashcard fc = new Flashcard();
				fc.setLesson(flashcardLesson);
				fc.setWord(gfc.getWord());
				fc.setMeaning(gfc.getMeaning());
				fc.setCulturalNote(gfc.getCulturalNote());
				fc.setSourceContentId(gfc.getSourceContentId());
				fc.setEvidence(gfc.getEvidence());

				Flashcard savedFc = flashcardRepository.save(fc);
				if (gfc.getWord() != null) {
					flashcardWordMap.put(normalizeUnicode(gfc.getWord()), savedFc);
				}
			}
		}

		if (studySet.getQuizQuestions() != null && !studySet.getQuizQuestions().isEmpty()) {
			quizLesson = new Lesson();
			quizLesson.setTrack(savedTrack);
			quizLesson.setTitle("Comprehension Quiz");
			quizLesson.setDescription("Test your understanding of the community stories");
			quizLesson.setType("QUIZ");
			quizLesson.setLessonOrder(lessonOrderCounter++);
			quizLesson = lessonRepository.save(quizLesson);

			for (GeneratedStudySet.GeneratedQuizQuestion gq : studySet.getQuizQuestions()) {
				QuizQuestion qq = new QuizQuestion();
				qq.setLesson(quizLesson);
				qq.setQuestion(gq.getQuestion());
				qq.setOptionA(gq.getOptionA());
				qq.setOptionB(gq.getOptionB());
				qq.setOptionC(gq.getOptionC());
				qq.setOptionD(gq.getOptionD());
				qq.setCorrectOption(gq.getCorrectOption());
				qq.setSourceContentId(gq.getSourceContentId());
				qq.setEvidence(gq.getEvidence());

				if (gq.getFlashcardWord() != null) {
					String norm = normalizeUnicode(gq.getFlashcardWord());
					if (flashcardWordMap.containsKey(norm)) {
						qq.setFlashcard(flashcardWordMap.get(norm));
					}
				}

				quizQuestionRepository.save(qq);
			}
		}

		savedTrack.setTotalLessons(lessonOrderCounter - 1);
		learningTrackRepository.save(savedTrack);

		job.setResultTrackId(savedTrack.getId());
		generationJobRepository.save(job);

		return savedTrack.getId();
	}

	public List<StudySetSummaryResponse> getMyStudySets(UUID userId) {
		List<LearningTrack> tracks = learningTrackRepository.findByOriginAndOwnerUserIdOrderByCreatedAtDesc("AI", userId);
		List<StudySetSummaryResponse> summaries = new ArrayList<>();

		for (LearningTrack track : tracks) {
			long attemptsCount = studySetAttemptRepository.countByOwnerUserIdAndTrackId(userId, track.getId());
			List<StudySetAttempt> attempts = studySetAttemptRepository
					.findByOwnerUserIdAndTrackIdOrderByTakenAtDesc(userId, track.getId());
			Integer bestScore = attempts.stream()
					.map(StudySetAttempt::getScore)
					.max(Integer::compare)
					.orElse(null);
			List<String> sourceIds = track.getSourceContentIds() != null && !track.getSourceContentIds().isBlank()
					? Arrays.asList(track.getSourceContentIds().split(","))
					: List.of();

			StudySetSummaryResponse summary = StudySetSummaryResponse.builder()
					.id(track.getId())
					.title(track.getTitle())
					.description(track.getDescription())
					.region(track.getRegion())
					.occupation(track.getOccupation())
					.totalLessons(track.getTotalLessons())
					.origin(track.getOrigin())
					.sourceContentIds(sourceIds)
					.createdAt(track.getCreatedAt())
					.attemptCount(attemptsCount)
					.bestScore(bestScore)
					.build();

			summaries.add(summary);
		}

		return summaries;
	}

	public StudySetDetailResponse getMyStudySetDetail(UUID userId, Long trackId) {
		LearningTrack track = learningTrackRepository.findByIdAndOwnerUserId(trackId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Study set not found"));
		List<Lesson> lessons = lessonRepository.findByTrackIdOrderByLessonOrderAsc(trackId);
		List<StudySetAttempt> attempts = studySetAttemptRepository
				.findByOwnerUserIdAndTrackIdOrderByTakenAtDesc(userId, trackId);
		List<StudySetDetailResponse.LessonSummaryDto> lessonDtos = new ArrayList<>();
		List<StudySetDetailResponse.FlashcardDetailDto> flashcardDtos = new ArrayList<>();
		List<StudySetDetailResponse.QuizQuestionDetailDto> questionDtos = new ArrayList<>();
		List<StudySetDetailResponse.AttemptHistoryDto> attemptDtos = new ArrayList<>();
		List<String> sourceIds = null;
		StudySetDetailResponse response = null;

		for (Lesson lesson : lessons) {
			lessonDtos.add(StudySetDetailResponse.LessonSummaryDto.builder()
					.id(lesson.getId())
					.lessonOrder(lesson.getLessonOrder())
					.title(lesson.getTitle())
					.description(lesson.getDescription())
					.type(lesson.getType())
					.build());

			if ("FLASHCARDS".equalsIgnoreCase(lesson.getType())) {
				List<Flashcard> cards = flashcardRepository.findByLessonIdOrderByIdAsc(lesson.getId());
				for (Flashcard fc : cards) {
					flashcardDtos.add(StudySetDetailResponse.FlashcardDetailDto.builder()
							.id(fc.getId())
							.lessonId(lesson.getId())
							.word(fc.getWord())
							.meaning(fc.getMeaning())
							.culturalNote(fc.getCulturalNote())
							.audioUrl(fc.getAudioUrl())
							.recordedBy(fc.getRecordedBy())
							.sourceContentId(fc.getSourceContentId())
							.evidence(fc.getEvidence())
							.build());
				}
			} else if ("QUIZ".equalsIgnoreCase(lesson.getType())) {
				List<QuizQuestion> questions = quizQuestionRepository.findByLessonIdOrderByIdAsc(lesson.getId());
				for (QuizQuestion qq : questions) {
					questionDtos.add(StudySetDetailResponse.QuizQuestionDetailDto.builder()
							.id(qq.getId())
							.lessonId(lesson.getId())
							.question(qq.getQuestion())
							.optionA(qq.getOptionA())
							.optionB(qq.getOptionB())
							.optionC(qq.getOptionC())
							.optionD(qq.getOptionD())
							.correctOption(qq.getCorrectOption())
							.flashcardId(qq.getFlashcard() != null ? qq.getFlashcard().getId() : null)
							.sourceContentId(qq.getSourceContentId())
							.evidence(qq.getEvidence())
							.build());
				}
			}
		}

		for (StudySetAttempt att : attempts) {
			attemptDtos.add(StudySetDetailResponse.AttemptHistoryDto.builder()
					.id(att.getId())
					.lessonId(att.getLessonId())
					.score(att.getScore())
					.total(att.getTotal())
					.xpAwarded(att.getXpAwarded())
					.takenAt(att.getTakenAt())
					.build());
		}

		sourceIds = track.getSourceContentIds() != null && !track.getSourceContentIds().isBlank()
				? Arrays.asList(track.getSourceContentIds().split(","))
				: List.of();

		response = StudySetDetailResponse.builder()
				.id(track.getId())
				.title(track.getTitle())
				.description(track.getDescription())
				.region(track.getRegion())
				.occupation(track.getOccupation())
				.totalLessons(track.getTotalLessons())
				.sourceContentIds(sourceIds)
				.createdAt(track.getCreatedAt())
				.lessons(lessonDtos)
				.flashcards(flashcardDtos)
				.quizQuestions(questionDtos)
				.attempts(attemptDtos)
				.build();

		return response;
	}

	@Transactional
	public void deleteMyStudySet(UUID userId, Long trackId) {
		LearningTrack track = learningTrackRepository.findByIdAndOwnerUserId(trackId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Study set not found"));

		learningTrackRepository.delete(track);
	}

	@Transactional
	public StudyAttemptResultResponse submitQuizAttempt(UUID userId, Long trackId, SubmitStudyAttemptRequest request) {
		LearningTrack track = learningTrackRepository.findByIdAndOwnerUserId(trackId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Study set not found"));
		Lesson lesson = lessonRepository.findById(request.getLessonId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
		List<QuizQuestion> questions = null;
		Map<Long, String> correctOptionMap = new HashMap<>();
		int correctCount = 0;
		int total = 0;
		int percentage = 0;
		boolean passed = false;
		boolean isFirstAttempt = false;
		int awardedXp = 0;
		StudySetAttempt attempt = null;
		StudySetAttempt savedAttempt = null;
		StudyAttemptResultResponse response = null;

		if (!lesson.getTrack().getId().equals(track.getId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson does not belong to specified study set");
		}

		Map<Long, QuizQuestion> questionMap = new HashMap<>();
		questions = quizQuestionRepository.findByLessonIdOrderByIdAsc(lesson.getId());
		total = questions.size();
		for (QuizQuestion q : questions) {
			correctOptionMap.put(q.getId(), q.getCorrectOption());
			questionMap.put(q.getId(), q);
		}

		if (request.getAnswers() != null) {
			for (SubmitStudyAttemptRequest.QuizAnswerItem ans : request.getAnswers()) {
				if (ans.getQuestionId() != null && ans.getSelectedOption() != null) {
					String expected = correctOptionMap.get(ans.getQuestionId());
					QuizQuestion q = questionMap.get(ans.getQuestionId());
					boolean isCorrect = expected != null && expected.equalsIgnoreCase(ans.getSelectedOption().trim());

					if (isCorrect) {
						correctCount++;
						if (q != null && q.getFlashcard() != null) {
							weakWordReviewService.recordCorrectAnswer(userId, q.getFlashcard().getId());
						}
					} else {
						if (q != null && q.getFlashcard() != null) {
							weakWordReviewService.recordWrongAnswer(userId, q.getFlashcard().getId());
						}
					}
				}
			}
		}

		percentage = total > 0 ? (int) Math.round((correctCount * 100.0) / total) : 0;
		passed = percentage >= 50;

		isFirstAttempt = !studySetAttemptRepository.existsByOwnerUserIdAndTrackId(userId, trackId);

		if (isFirstAttempt) {
			Instant startOfDay = LocalDate.now(clock).atStartOfDay(zoneId).toInstant();
			List<StudySetAttempt> todayAttempts = studySetAttemptRepository
					.findByOwnerUserIdOrderByTakenAtDesc(userId)
					.stream()
					.filter(a -> a.getTakenAt() != null && !a.getTakenAt().isBefore(startOfDay))
					.toList();
			int todayEarned = todayAttempts.stream().mapToInt(StudySetAttempt::getXpAwarded).sum();

			awardedXp = xpPolicy.calculateAiSetXp(correctCount, passed, todayEarned);

			if (awardedXp > 0) {
				LessonProgress progress = lessonProgressRepository.findByUserIdAndLessonId(userId, lesson.getId())
						.orElseGet(LessonProgress::new);
				progress.setUserId(userId);
				progress.setLesson(lesson);
				progress.setCompleted(passed);
				progress.setScore(correctCount);
				progress.setXpEarned(awardedXp);
				if (passed) {
					progress.setCompletedAt(LocalDateTime.now(clock.withZone(zoneId)));
				}
				lessonProgressRepository.save(progress);
			}
		} else {
			awardedXp = 0;
		}

		attempt = new StudySetAttempt();
		attempt.setOwnerUserId(userId);
		attempt.setTrackId(trackId);
		attempt.setLessonId(lesson.getId());
		attempt.setScore(correctCount);
		attempt.setTotal(total);
		attempt.setXpAwarded(awardedXp);
		attempt.setTakenAt(Instant.now(clock));

		savedAttempt = studySetAttemptRepository.save(attempt);

		response = StudyAttemptResultResponse.builder()
				.attemptId(savedAttempt.getId())
				.trackId(trackId)
				.lessonId(lesson.getId())
				.score(correctCount)
				.total(total)
				.percentage(percentage)
				.passed(passed)
				.xpAwarded(awardedXp)
				.firstAttempt(isFirstAttempt)
				.takenAt(savedAttempt.getTakenAt())
				.build();

		return response;
	}

	private String normalizeUnicode(String text) {
		String normalized = "";

		if (text == null) {
			return "";
		}

		normalized = Normalizer.normalize(text, Normalizer.Form.NFC)
				.toLowerCase()
				.replaceAll("\\s+", " ")
				.trim();

		return normalized;
	}
}
