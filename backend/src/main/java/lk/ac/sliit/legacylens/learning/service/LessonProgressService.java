package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import lk.ac.sliit.legacylens.learning.repository.LessonProgressRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonRepository;
import org.springframework.stereotype.Service;
import lk.ac.sliit.legacylens.learning.dto.LessonProgressResponse;
import java.util.List;
import java.util.Optional;

@Service
public class LessonProgressService {

    private final LessonProgressRepository lessonProgressRepository;
    private final LessonRepository lessonRepository;
    private final XpService xpService;
    private final QuizQuestionService quizQuestionService;

    public LessonProgressService(
        LessonProgressRepository lessonProgressRepository,
        LessonRepository lessonRepository,
        XpService xpService,
        QuizQuestionService quizQuestionService) {

    this.lessonProgressRepository = lessonProgressRepository;
    this.lessonRepository = lessonRepository;
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

    public List<LessonProgressResponse> getUserProgressResponse(Long userId) {

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

    public LessonProgress updateProgress(
            Long userId,
            Long lessonId,
            boolean completed,
            Integer score,
            Integer xpEarned) {

        LessonProgress progress =
                lessonProgressRepository
                        .findByUserIdAndLessonId(userId, lessonId)
                        .orElseGet(LessonProgress::new);

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Lesson not found"));

        progress.setUserId(userId);
        progress.setLesson(lesson);
        progress.setCompleted(completed);
        progress.setScore(score);
        progress.setXpEarned(xpEarned);

        return lessonProgressRepository.save(progress);
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
                        new IllegalArgumentException("Lesson not found"));

        long totalQuestions =
                quizQuestionService.getQuestionCountForLesson(lessonId);

        if (correctAnswers > totalQuestions) {
                throw new IllegalArgumentException(
                        "Correct answers cannot exceed total quiz questions"
                );
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

        progress.setUserId(userId);
        progress.setLesson(lesson);
        progress.setCompleted(completed);
        progress.setScore(correctAnswers);
        progress.setXpEarned(xpEarned);

        return lessonProgressRepository.save(progress);
        }
}