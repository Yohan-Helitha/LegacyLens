package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.learning.dto.LessonProgressResponse;
import lk.ac.sliit.legacylens.learning.dto.TrackProgressResponse;
import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.repository.LessonProgressRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonRepository;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
@Service
public class LessonProgressService {

    private final LessonProgressRepository lessonProgressRepository;
    private final LessonRepository lessonRepository;
    private final LearningTrackRepository learningTrackRepository;
    private final XpService xpService;
    private final QuizQuestionService quizQuestionService;
    
    public LessonProgressService(
            LessonProgressRepository lessonProgressRepository,
            LessonRepository lessonRepository,
            LearningTrackRepository learningTrackRepository,
            XpService xpService,
            QuizQuestionService quizQuestionService) {

        this.lessonProgressRepository = lessonProgressRepository;
        this.lessonRepository = lessonRepository;
        this.learningTrackRepository = learningTrackRepository;
        this.xpService = xpService;
        this.quizQuestionService = quizQuestionService;
    }

    public Optional<LessonProgress> getProgress(
            Long userId,
            Long lessonId) {

        return lessonProgressRepository
                .findByUserIdAndLessonId(userId, lessonId);
    }

    public List<LessonProgress> getUserProgress(Long userId) {
        return lessonProgressRepository.findByUserId(userId);
    }

    public Optional<LessonProgressResponse> getProgressResponse(
            Long userId,
            Long lessonId) {

        return lessonProgressRepository
                .findByUserIdAndLessonId(userId, lessonId)
                .map(progress -> new LessonProgressResponse(
                        progress.getLesson().getId(),
                        progress.isCompleted(),
                        progress.getScore(),
                        progress.getXpEarned()
                ));
    }

    public List<LessonProgressResponse> getUserProgressResponse(
            Long userId) {

        return lessonProgressRepository.findByUserId(userId)
                .stream()
                .map(progress -> new LessonProgressResponse(
                        progress.getLesson().getId(),
                        progress.isCompleted(),
                        progress.getScore(),
                        progress.getXpEarned()
                ))
                .toList();
    }

    public List<TrackProgressResponse> getUserTrackProgress(
            Long userId) {

        List<LearningTrack> tracks =
                learningTrackRepository.findAll();

        return tracks.stream()
                .map(track -> {

                    int totalLessons =
                            track.getTotalLessons() == null
                                    ? 0
                                    : track.getTotalLessons();

                    long completedLessons =
                            lessonProgressRepository
                                    .countByUserIdAndLesson_Track_IdAndCompletedTrue(
                                            userId,
                                            track.getId()
                                    );

                    long xpEarned =
                            lessonProgressRepository
                                    .sumXpByUserIdAndTrackId(
                                            userId,
                                            track.getId()
                                    );

                    int progressPercentage =
                            totalLessons == 0
                                    ? 0
                                    : (int) Math.round(
                                            (completedLessons * 100.0)
                                                    / totalLessons
                                    );

                    return new TrackProgressResponse(
                            track.getId(),
                            track.getTitle(),
                            totalLessons,
                            completedLessons,
                            progressPercentage,
                            xpEarned
                    );
                })
                .toList();
    }

    public LessonProgress updateProgress(
            Long userId,
            Long lessonId,
            boolean completed,
            Integer score,
            Integer xpEarned) {

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Lesson not found"
                        ));

        LessonProgress progress =
                lessonProgressRepository
                        .findByUserIdAndLessonId(userId, lessonId)
                        .orElseGet(LessonProgress::new);

        progress.setUserId(userId);
        progress.setLesson(lesson);
        progress.setCompleted(completed);
        progress.setScore(score);
        progress.setXpEarned(xpEarned);

        return lessonProgressRepository.save(progress);
    }

    public List<TrackProgressResponse> getTrackProgress(Long userId) {

    List<LearningTrack> tracks =
            learningTrackRepository.findAll();

    return tracks.stream()
            .map(track -> {

                long totalLessons =
                        lessonRepository.countByTrackId(track.getId());

                long completedLessons =
        lessonProgressRepository
                .countByUserIdAndLesson_Track_IdAndCompletedTrue(
                        userId,
                        track.getId()
                );

                long xpEarned =
                        lessonProgressRepository
                                .sumXpByUserIdAndTrackId(
                                        userId,
                                        track.getId()
                                );

                int progressPercentage =
                        totalLessons == 0
                                ? 0
                                : (int) Math.round(
                                        (completedLessons * 100.0)
                                                / totalLessons
                                );

                return new TrackProgressResponse(
                        track.getId(),
                        track.getTitle(),
                        (int) totalLessons,
                        completedLessons,
                        progressPercentage,
                        xpEarned
                );
            })
            .toList();
}

    public LessonProgress completeLesson(
            Long userId,
            Long lessonId,
            int correctAnswers) {

        if (correctAnswers < 0) {
            throw new IllegalArgumentException(
                    "Correct answers cannot be negative"
            );
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Lesson not found"
                        ));

        long totalQuestions =
                quizQuestionService.getQuestionCountForLesson(lessonId);

        if (correctAnswers > totalQuestions) {
            throw new IllegalArgumentException(
                    "Correct answers cannot exceed total quiz questions"
            );
        }

        LessonProgress progress =
                lessonProgressRepository
                        .findByUserIdAndLessonId(userId, lessonId)
                        .orElseGet(LessonProgress::new);

        /*
         * If the lesson was already successfully completed,
         * don't award XP again.
         */
        if (progress.isCompleted()) {
            return progress;
        }

        int scorePercentage = totalQuestions == 0
                ? 0
                : (int) Math.round(
                        (correctAnswers * 100.0) / totalQuestions
                );

        // 50% or above = lesson passed
        boolean completed = scorePercentage >= 50;

        int xpEarned = xpService.calculateQuizXp(
                correctAnswers,
                completed
        );

        progress.setUserId(userId);
        progress.setLesson(lesson);
        progress.setCompleted(completed);
        progress.setScore(correctAnswers);
        progress.setXpEarned(xpEarned);

        return lessonProgressRepository.save(progress);
    }
}