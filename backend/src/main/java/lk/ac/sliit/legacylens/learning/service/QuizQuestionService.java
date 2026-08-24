package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.learning.dto.QuizAnswerRequest;
import lk.ac.sliit.legacylens.learning.dto.QuizResult;
import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.entity.QuizQuestion;
import lk.ac.sliit.legacylens.learning.repository.LessonRepository;
import lk.ac.sliit.legacylens.learning.repository.QuizQuestionRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class QuizQuestionService {

    private final QuizQuestionRepository quizQuestionRepository;
    private final LessonRepository lessonRepository;

    public QuizQuestionService(
            QuizQuestionRepository quizQuestionRepository,
            LessonRepository lessonRepository) {

        this.quizQuestionRepository = quizQuestionRepository;
        this.lessonRepository = lessonRepository;
    }

    public List<QuizQuestion> getQuestionsByLessonId(Long lessonId) {
        return quizQuestionRepository
                .findByLessonIdOrderByIdAsc(lessonId);
    }

    public QuizQuestion getQuestionById(Long id) {
        return quizQuestionRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Quiz question not found"
                        ));
    }

    public QuizQuestion createQuestion(
            Long lessonId,
            QuizQuestion question) {

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Lesson not found"
                        ));

        question.setLesson(lesson);

        return quizQuestionRepository.save(question);
    }

    public QuizResult evaluateAnswer(
            Long questionId,
            String selectedOption) {

        QuizQuestion question = getQuestionById(questionId);

        boolean correct = question.getCorrectOption()
                .equalsIgnoreCase(selectedOption.trim());

        int score = correct ? 1 : 0;

        return new QuizResult(
                questionId,
                correct,
                score
        );
    }

    public long getQuestionCountForLesson(Long lessonId) {
        return quizQuestionRepository.countByLessonId(lessonId);
    }

    public List<QuizResult> evaluateAnswers(
            Long lessonId,
            List<QuizAnswerRequest> answers) {

        if (!lessonRepository.existsById(lessonId)) {
            throw new ResourceNotFoundException(
                    "Lesson not found"
            );
        }

        List<QuizQuestion> lessonQuestions =
                quizQuestionRepository
                        .findByLessonIdOrderByIdAsc(lessonId);

        if (answers.size() != lessonQuestions.size()) {
            throw new IllegalArgumentException(
                    "All quiz questions must be answered"
            );
        }

        Set<Long> validQuestionIds = lessonQuestions.stream()
                .map(QuizQuestion::getId)
                .collect(java.util.stream.Collectors.toSet());

        Set<Long> submittedQuestionIds = new HashSet<>();

        List<QuizResult> results = new ArrayList<>();

        for (QuizAnswerRequest answer : answers) {

            if (!submittedQuestionIds.add(answer.getQuestionId())) {
                throw new IllegalArgumentException(
                        "Duplicate question submitted"
                );
            }

            if (!validQuestionIds.contains(answer.getQuestionId())) {
                throw new IllegalArgumentException(
                        "Question does not belong to this lesson"
                );
            }

            results.add(
                    evaluateAnswer(
                            answer.getQuestionId(),
                            answer.getSelectedOption()
                    )
            );
        }

        return results;
    }

    public int calculateTotalScore(List<QuizResult> results) {
        return results.stream()
                .mapToInt(QuizResult::getScore)
                .sum();
    }
}