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

    public LearningDashboardResponse getDashboard(Long userId) {

        long completedLessons =
                lessonProgressRepository
                        .countByUserIdAndCompletedTrue(userId);

        long totalLessons =
                lessonRepository.count();

        long totalXp =
                lessonProgressRepository
                        .sumXpByUserId(userId);

        long completedTracks =
                learningTrackRepository
                        .countCompletedTracks(userId);

        double progressPercentage =
                totalLessons == 0
                        ? 0
                        : Math.round(
                                (completedLessons * 100.0 / totalLessons)
                                        * 100.0
                        ) / 100.0;

        return new LearningDashboardResponse(
                totalXp,
                completedLessons,
                totalLessons,
                progressPercentage,
                completedTracks
        );
    }

    public TrackDashboardResponse getTrackDashboard(
            Long userId,
            Long trackId) {

        LearningTrack track =
                learningTrackRepository.findById(trackId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Learning track not found"
                                ));

        List<Lesson> lessons =
                lessonRepository
                        .findByTrackIdOrderByLessonOrderAsc(trackId);

        List<LessonProgress> progressList =
                lessonProgressRepository.findByUserId(userId);

        Map<Long, LessonProgress> progressMap =
                progressList.stream()
                        .filter(progress -> progress.getLesson() != null)
                        .collect(Collectors.toMap(
                                progress -> progress.getLesson().getId(),
                                progress -> progress,
                                (existing, replacement) -> existing
                        ));

        List<LessonProgressItem> lessonItems =
                lessons.stream()
                        .map(lesson -> {

                            LessonProgress progress =
                                    progressMap.get(lesson.getId());

                            boolean completed =
                                    progress != null
                                            && progress.isCompleted();

                            int score =
                                    progress != null
                                            ? progress.getScore()
                                            : 0;

                            int xpEarned =
                                    progress != null
                                            ? progress.getXpEarned()
                                            : 0;

                            return new LessonProgressItem(
                                    lesson.getId(),
                                    lesson.getLessonOrder(),
                                    lesson.getTitle(),
                                    lesson.getDescription(),
                                    completed,
                                    score,
                                    xpEarned
                            );
                        })
                        .toList();

        long totalLessons = lessons.size();

        long completedLessons =
                lessonItems.stream()
                        .filter(LessonProgressItem::isCompleted)
                        .count();

        long totalXp =
                lessonItems.stream()
                        .mapToLong(LessonProgressItem::getXpEarned)
                        .sum();

        double progressPercentage =
                totalLessons == 0
                        ? 0
                        : Math.round(
                                (completedLessons * 100.0 / totalLessons)
                                        * 100.0
                        ) / 100.0;

        boolean completed =
                totalLessons > 0
                        && completedLessons == totalLessons;

        return new TrackDashboardResponse(
                track.getId(),
                track.getTitle(),
                completedLessons,
                totalLessons,
                progressPercentage,
                totalXp,
                completed,
                lessonItems
        );
    }

    public NextLessonResponse getNextLesson(
            Long userId,
            Long trackId) {

        if (!learningTrackRepository.existsById(trackId)) {
            throw new ResourceNotFoundException(
                    "Learning track not found"
            );
        }

        List<Lesson> lessons =
                lessonRepository
                        .findByTrackIdOrderByLessonOrderAsc(trackId);

        List<LessonProgress> progressList =
                lessonProgressRepository.findByUserId(userId);

        Set<Long> completedLessonIds =
                progressList.stream()
                        .filter(LessonProgress::isCompleted)
                        .filter(progress -> progress.getLesson() != null)
                        .map(progress -> progress.getLesson().getId())
                        .collect(Collectors.toSet());

        Optional<Lesson> nextLesson =
                lessons.stream()
                        .filter(lesson ->
                                !completedLessonIds.contains(lesson.getId()))
                        .findFirst();

        if (nextLesson.isEmpty()) {
            return new NextLessonResponse(
                    true,
                    null
            );
        }

        Lesson lesson = nextLesson.get();

        NextLessonResponse.LessonInfo lessonInfo =
                new NextLessonResponse.LessonInfo(
                        lesson.getId(),
                        lesson.getLessonOrder(),
                        lesson.getTitle(),
                        lesson.getDescription(),
                        lesson.getType()
                );

        return new NextLessonResponse(
                false,
                lessonInfo
        );
    }
}