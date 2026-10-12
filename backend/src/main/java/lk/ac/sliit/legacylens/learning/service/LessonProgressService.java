package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.learning.dto.LessonProgressResponse;
import lk.ac.sliit.legacylens.learning.dto.StreakResponse;
import lk.ac.sliit.legacylens.learning.dto.TrackProgressResponse;
import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import lk.ac.sliit.legacylens.learning.progress.StreakCalculator;
import lk.ac.sliit.legacylens.learning.progress.XpPolicy;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonProgressRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LessonProgressService {

	private static final Logger log = LoggerFactory.getLogger(LessonProgressService.class);

	private final LessonProgressRepository lessonProgressRepository;
	private final LessonRepository lessonRepository;
	private final LearningTrackRepository learningTrackRepository;
	private final XpPolicy xpPolicy;
	private final StreakCalculator streakCalculator;
	private final Clock clock;

	public LessonProgressService(
			LessonProgressRepository lessonProgressRepository,
			LessonRepository lessonRepository,
			LearningTrackRepository learningTrackRepository,
			XpPolicy xpPolicy,
			StreakCalculator streakCalculator,
			Clock clock) {
		this.lessonProgressRepository = lessonProgressRepository;
		this.lessonRepository = lessonRepository;
		this.learningTrackRepository = learningTrackRepository;
		this.xpPolicy = xpPolicy;
		this.streakCalculator = streakCalculator;
		this.clock = clock;
	}

	public Optional<LessonProgress> getProgress(UUID userId, Long lessonId) {
		Optional<LessonProgress> progress = lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId);

		return progress;
	}

	public List<LessonProgress> getUserProgress(UUID userId) {
		List<LessonProgress> progressList = lessonProgressRepository.findByUserId(userId);

		return progressList;
	}

	public Optional<LessonProgressResponse> getProgressResponse(UUID userId, Long lessonId) {
		Optional<LessonProgressResponse> response = lessonProgressRepository
				.findByUserIdAndLessonId(userId, lessonId)
				.map(progress -> new LessonProgressResponse(
						progress.getLesson().getId(),
						progress.isCompleted(),
						progress.getScore(),
						progress.getXpEarned()
				));

		return response;
	}

	public List<LessonProgressResponse> getUserProgressResponse(UUID userId) {
		List<LessonProgressResponse> responses = lessonProgressRepository.findByUserId(userId)
				.stream()
				.map(progress -> new LessonProgressResponse(
						progress.getLesson().getId(),
						progress.isCompleted(),
						progress.getScore(),
						progress.getXpEarned()
				))
				.toList();

		return responses;
	}

	public List<TrackProgressResponse> getUserTrackProgress(UUID userId) {
		Map<Long, LearningTrack> trackMap = new LinkedHashMap<>();
		for (LearningTrack track : learningTrackRepository.findByOriginAndVisibility("ADMIN", "PUBLIC")) {
			trackMap.put(track.getId(), track);
		}
		if (userId != null) {
			for (LearningTrack track : learningTrackRepository.findByOwnerUserIdOrderByCreatedAtDesc(userId)) {
				trackMap.putIfAbsent(track.getId(), track);
			}
		}

		List<TrackProgressResponse> results = trackMap.values().stream()
				.map(track -> {
					long completedLessons = userId == null ? 0 : lessonProgressRepository
							.countByUserIdAndLesson_Track_IdAndCompletedTrue(userId, track.getId());
					int rawTotalLessons = track.getTotalLessons() == null ? 0 : track.getTotalLessons();
					long actualLessonCount = lessonRepository.countByTrackId(track.getId());
					int totalLessons = (int) Math.max(Math.max(rawTotalLessons, actualLessonCount), completedLessons);
					long cappedCompletedLessons = Math.min(completedLessons, totalLessons);
					long xpEarned = userId == null ? 0 : lessonProgressRepository.sumXpByUserIdAndTrackId(userId, track.getId());
					int progressPercentage = totalLessons == 0 ? 0 : Math.min(100, (int) Math.round((cappedCompletedLessons * 100.0) / totalLessons));

					return new TrackProgressResponse(
							track.getId(),
							track.getTitle(),
							totalLessons,
							cappedCompletedLessons,
							progressPercentage,
							xpEarned
					);
				})
				.toList();

		return results;
	}

	@Transactional
	public LessonProgress completeFlashcardLesson(UUID userId, Long lessonId) {
		Lesson lesson = lessonRepository.findById(lessonId)
				.orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
		LessonProgress progress = lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId)
				.orElseGet(LessonProgress::new);

		if (progress.isCompleted()) {
			return progress;
		}

		int xpEarned = xpPolicy.calculateFlashcardLessonXp(true);
		LocalDateTime now = LocalDateTime.now(clock.withZone(ZoneId.of("Asia/Colombo")));

		progress.setUserId(userId);
		progress.setLesson(lesson);
		progress.setCompleted(true);
		progress.setScore(100);
		progress.setXpEarned(xpEarned);
		progress.setCompletedAt(now);

		try {
			progress = lessonProgressRepository.save(progress);
		} catch (DataIntegrityViolationException ex) {
			log.warn("Concurrent lesson progress creation detected for user {} lesson {}", userId, lessonId);
			progress = lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId)
					.orElseThrow(() -> ex);
		}

		return progress;
	}

	@Transactional
	public LessonProgress completeQuizLessonServerGraded(
			UUID userId,
			Long lessonId,
			int correctAnswers,
			long totalQuestions) {
		Lesson lesson = lessonRepository.findById(lessonId)
				.orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
		LessonProgress progress = lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId)
				.orElseGet(LessonProgress::new);

		if (progress.isCompleted()) {
			return progress;
		}

		int scorePercentage = totalQuestions == 0 ? 0 : (int) Math.round((correctAnswers * 100.0) / totalQuestions);
		boolean passed = scorePercentage >= 50;
		int xpEarned = xpPolicy.calculateQuizXp(correctAnswers, passed);
		LocalDateTime now = LocalDateTime.now(clock.withZone(ZoneId.of("Asia/Colombo")));

		progress.setUserId(userId);
		progress.setLesson(lesson);
		progress.setCompleted(passed);
		progress.setScore(correctAnswers);
		progress.setXpEarned(xpEarned);
		if (passed) {
			progress.setCompletedAt(now);
		}

		try {
			progress = lessonProgressRepository.save(progress);
		} catch (DataIntegrityViolationException ex) {
			log.warn("Concurrent quiz completion detected for user {} lesson {}", userId, lessonId);
			progress = lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId)
					.orElseThrow(() -> ex);
		}

		return progress;
	}

	public StreakResponse getStreak(UUID userId) {
		List<LessonProgress> userProgress = lessonProgressRepository.findByUserId(userId);
		Set<LocalDate> completedDates = userProgress.stream()
				.filter(LessonProgress::isCompleted)
				.map(LessonProgress::getCompletedAt)
				.filter(Objects::nonNull)
				.map(LocalDateTime::toLocalDate)
				.collect(Collectors.toSet());
		int currentStreak = streakCalculator.calculateCurrentStreak(completedDates);
		List<Boolean> last7Days = streakCalculator.calculateLast7Days(completedDates);

		StreakResponse response = new StreakResponse(currentStreak, last7Days);

		return response;
	}
}