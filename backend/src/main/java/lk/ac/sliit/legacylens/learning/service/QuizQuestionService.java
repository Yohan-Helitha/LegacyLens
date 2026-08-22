package lk.ac.sliit.legacylens.learning.service;
import java.util.HashSet;
import java.util.Set;
import lk.ac.sliit.legacylens.learning.entity.QuizQuestion;
import lk.ac.sliit.legacylens.learning.repository.QuizQuestionRepository;
import org.springframework.stereotype.Service;
import lk.ac.sliit.legacylens.learning.dto.QuizResult;
import java.util.List;
import java.util.Optional;
import lk.ac.sliit.legacylens.learning.dto.QuizAnswerRequest;
import java.util.ArrayList;
import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.repository.LessonRepository;


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
        return quizQuestionRepository.findByLessonIdOrderByIdAsc(lessonId);
    }

    public Optional<QuizQuestion> getQuestionById(Long id) {
        return quizQuestionRepository.findById(id);
    }

    public QuizQuestion createQuestion(QuizQuestion question) {

    if (question.getLesson() == null ||
            question.getLesson().getId() == null) {

        throw new IllegalArgumentException(
                "Lesson is required"
        );
    }

    Lesson lesson = lessonRepository.findById(
            question.getLesson().getId()
    ).orElseThrow(() ->
            new IllegalArgumentException("Lesson not found")
    );

    question.setLesson(lesson);

    return quizQuestionRepository.save(question);
}

    public boolean checkAnswer(Long questionId, String selectedOption) {

    Optional<QuizQuestion> questionOptional =
            quizQuestionRepository.findById(questionId);

    if (questionOptional.isEmpty()) {
        throw new IllegalArgumentException("Quiz question not found");
    }

    QuizQuestion question = questionOptional.get();

    return question.getCorrectOption()
            .equalsIgnoreCase(selectedOption.trim());
        }

    public QuizResult evaluateAnswer(Long questionId, String selectedOption) {

            Optional<QuizQuestion> questionOptional =
                    quizQuestionRepository.findById(questionId);

            if (questionOptional.isEmpty()) {
                throw new IllegalArgumentException("Quiz question not found");
            }

            QuizQuestion question = questionOptional.get();

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

    List<QuizQuestion> lessonQuestions =
            quizQuestionRepository
                    .findByLessonIdOrderByIdAsc(lessonId);

    if (answers.size() != lessonQuestions.size()) {
    throw new IllegalArgumentException(
            "All quiz questions must be answered"
    );
}

    List<Long> validQuestionIds = lessonQuestions.stream()
            .map(QuizQuestion::getId)
            .toList();
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

        QuizResult result = evaluateAnswer(
                answer.getQuestionId(),
                answer.getSelectedOption()
        );

        results.add(result);
    }

    return results;
}
public int calculateTotalScore(List<QuizResult> results) {

    return results.stream()
            .mapToInt(QuizResult::getScore)
            .sum();
}

}