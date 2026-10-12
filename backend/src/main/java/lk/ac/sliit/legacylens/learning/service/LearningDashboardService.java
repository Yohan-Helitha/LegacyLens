package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.learning.dto.LearningDashboardResponse;
import lk.ac.sliit.legacylens.learning.dto.LessonProgressItem;
import lk.ac.sliit.legacylens.learning.dto.NextLessonResponse;
import lk.ac.sliit.legacylens.learning.dto.TrackDashboardResponse;
import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonProgressRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LearningDashboardService {

	private final LessonProgressRepository lessonProgressRepository;
	private final LessonRepository lessonRepository;
	private final LearningTrackRepository learningTrackRepository;

	public LearningDashboardService(
			LessonProgressRepository lessonProgressRepository,
			LessonRepository lessonRepository,
			LearningTrackRepository learningTrackRepository) {
		this.lessonProgressRepository = lessonProgressRepository;
		this.lessonRepository = lessonRepository;
		this.learningTrackRepository = learningTrackRepository;
	}

	public LearningDashboardResponse getDashboard(UUID userId) {
		long completedLessons = lessonProgressRepository.countByUserIdAndCompletedTrue(userId);
		long totalLessons = lessonRepository.countByTrack_OriginAndTrack_Visibility("ADMIN", "PUBLIC")
				+ lessonRepository.countByTrack_OwnerUserId(userId);
		if (totalLessons < completedLessons) {
			totalLessons = completedLessons;
		}
		long totalXp = lessonProgressRepository.sumXpByUserId(userId);
		long completedTracks = learningTrackRepository.countCompletedTracks(userId);
		double progressPercentage = 0.0;
		LearningDashboardResponse response = null;

		progressPercentage = totalLessons == 0
				? 0.0
				: Math.min(100.0, Math.round((completedLessons * 100.0 / totalLessons) * 100.0) / 100.0);

		response = new LearningDashboardResponse(
				totalXp,
				completedLessons,
				totalLessons,
				progressPercentage,
				completedTracks
		);

		return response;
	}

	public TrackDashboardResponse getTrackDashboard(UUID userId, Long trackId) {
		LearningTrack track = learningTrackRepository.findById(trackId)
				.orElseThrow(() -> new ResourceNotFoundException("Learning track not found"));
		List<Lesson> lessons = lessonRepository.findByTrackIdOrderByLessonOrderAsc(trackId);
		List<LessonProgress> progressList = lessonProgressRepository.findByUserId(userId);
		Map<Long, LessonProgress> progressMap = null;
		List<LessonProgressItem> lessonItems = null;
		long totalLessons = 0;
		long completedLessons = 0;
		long totalXp = 0;
		double progressPercentage = 0.0;
		boolean completed = false;
		TrackDashboardResponse response = null;

		progressMap = progressList.stream()
				.filter(progress -> progress.getLesson() != null)
				.collect(Collectors.toMap(
						progress -> progress.getLesson().getId(),
						progress -> progress,
						(existing, replacement) -> existing
				));

		final Map<Long, LessonProgress> lookup = progressMap;
		lessonItems = lessons.stream()
				.map(lesson -> {
					LessonProgress progress = lookup.get(lesson.getId());
					boolean isDone = progress != null && progress.isCompleted();
					int score = progress != null ? progress.getScore() : 0;
					int xpEarned = progress != null ? progress.getXpEarned() : 0;

					return new LessonProgressItem(
							lesson.getId(),
							lesson.getLessonOrder(),
							lesson.getTitle(),
							lesson.getDescription(),
							lesson.getType(),
							isDone,
							score,
							xpEarned
					);
				})
				.toList();

		totalLessons = lessons.size();
		completedLessons = lessonItems.stream()
				.filter(LessonProgressItem::isCompleted)
				.count();
		totalXp = lessonItems.stream()
				.mapToLong(LessonProgressItem::getXpEarned)
				.sum();
		progressPercentage = totalLessons == 0
				? 0.0
				: Math.round((completedLessons * 100.0 / totalLessons) * 100.0) / 100.0;
		completed = totalLessons > 0 && completedLessons == totalLessons;

		response = new TrackDashboardResponse(
				track.getId(),
				track.getTitle(),
				completedLessons,
				totalLessons,
				progressPercentage,
				totalXp,
				completed,
				lessonItems
		);

		return response;
	}

	public NextLessonResponse getNextLesson(UUID userId, Long trackId) {
		if (!learningTrackRepository.existsById(trackId)) {
			throw new ResourceNotFoundException("Learning track not found");
		}

		List<Lesson> lessons = lessonRepository.findByTrackIdOrderByLessonOrderAsc(trackId);
		List<LessonProgress> progressList = lessonProgressRepository.findByUserId(userId);
		Set<Long> completedLessonIds = null;
		Optional<Lesson> nextLesson = Optional.empty();
		NextLessonResponse response = null;

		completedLessonIds = progressList.stream()
				.filter(LessonProgress::isCompleted)
				.filter(progress -> progress.getLesson() != null)
				.map(progress -> progress.getLesson().getId())
				.collect(Collectors.toSet());

		final Set<Long> completedIds = completedLessonIds;
		nextLesson = lessons.stream()
				.filter(lesson -> !completedIds.contains(lesson.getId()))
				.findFirst();

		if (nextLesson.isEmpty()) {
			return new NextLessonResponse(true, null);
		}

		Lesson lesson = nextLesson.get();
		NextLessonResponse.LessonInfo lessonInfo = new NextLessonResponse.LessonInfo(
				lesson.getId(),
				lesson.getLessonOrder(),
				lesson.getTitle(),
				lesson.getDescription(),
				lesson.getType()
		);

		response = new NextLessonResponse(false, lessonInfo);

		return response;
	}
}