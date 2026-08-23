package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.learning.entity.QuizQuestion;
import lk.ac.sliit.legacylens.learning.service.QuizQuestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.learning.dto.QuizAnswerRequest;
import java.util.List;
import lk.ac.sliit.legacylens.learning.dto.QuizResult;
import lk.ac.sliit.legacylens.learning.dto.QuizCompletionRequest;
import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import lk.ac.sliit.legacylens.learning.service.LessonProgressService;
import org.springframework.security.core.Authentication;
import lk.ac.sliit.legacylens.learning.dto.LessonProgressResponse;
import lk.ac.sliit.legacylens.learning.dto.QuizSubmissionRequest;
import lk.ac.sliit.legacylens.learning.dto.QuizSubmissionResponse;
import lk.ac.sliit.legacylens.learning.dto.QuizQuestionResponse;

@RestController
@RequestMapping("/api/learning")
public class QuizQuestionController {

    private final QuizQuestionService quizQuestionService;
    private final LessonProgressService lessonProgressService;
    
    public QuizQuestionController(
        QuizQuestionService quizQuestionService,
        LessonProgressService lessonProgressService) {

    this.quizQuestionService = quizQuestionService;
    this.lessonProgressService = lessonProgressService;
}

    @GetMapping("/lessons/{lessonId}/questions")
        public ResponseEntity<List<QuizQuestionResponse>> getQuestionsByLesson(
                @PathVariable Long lessonId) {

        List<QuizQuestionResponse> response =
                quizQuestionService
                        .getQuestionsByLessonId(lessonId)
                        .stream()
                        .map(QuizQuestionResponse::fromEntity)
                        .toList();

        return ResponseEntity.ok(response);
        }

    @GetMapping("/questions/{id}")
        public ResponseEntity<QuizQuestionResponse> getQuestionById(
                @PathVariable Long id) {

        return quizQuestionService.getQuestionById(id)
                .map(QuizQuestionResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        }

    @PostMapping("/lessons/{lessonId}/questions")
        public ResponseEntity<QuizQuestion> createQuestion(
                @PathVariable Long lessonId,
                @RequestBody QuizQuestion question) {

        return ResponseEntity.ok(
                quizQuestionService.createQuestion(lessonId, question)
        );
        }

    @PostMapping("/questions/{id}/answer")
    public ResponseEntity<QuizResult> checkAnswer(
            @PathVariable Long id,
            @Valid @RequestBody QuizAnswerRequest request) {

        QuizResult result = quizQuestionService.evaluateAnswer(
                id,
                request.getSelectedOption()
        );

        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/lessons/{lessonId}/complete")
public ResponseEntity<LessonProgressResponse> completeLesson(
        Authentication authentication,
        @PathVariable Long lessonId,
        @Valid @RequestBody QuizCompletionRequest request) {

    Long userId = Long.valueOf(authentication.getName());

    LessonProgress progress =
            lessonProgressService.completeLesson(
                    userId,
                    lessonId,
                    request.getCorrectAnswers()
            );

    LessonProgressResponse response = new LessonProgressResponse(
            progress.getLesson().getId(),
            progress.isCompleted(),
            progress.getScore(),
            progress.getXpEarned()
    );

    return ResponseEntity.ok(response);
}
  
        @PostMapping("/lessons/{lessonId}/submit")
public ResponseEntity<QuizSubmissionResponse> submitQuiz(
        Authentication authentication,
        @PathVariable Long lessonId,
        @Valid @RequestBody QuizSubmissionRequest request) {

    List<QuizResult> results =
            quizQuestionService.evaluateAnswers(
                    lessonId,
                    request.getAnswers()
            );

    int totalScore =
        quizQuestionService.calculateTotalScore(results);

long totalQuestions =
        quizQuestionService.getQuestionCountForLesson(lessonId);

Long userId = Long.valueOf(authentication.getName());

LessonProgress progress =
        lessonProgressService.completeLesson(
                userId,
                lessonId,
                totalScore
        );

QuizSubmissionResponse response =
        new QuizSubmissionResponse(
                results,
                totalScore,
                totalQuestions,
                progress.isCompleted(),
                progress.getXpEarned()
        );

    return ResponseEntity.ok(response);
}


}