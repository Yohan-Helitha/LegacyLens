package lk.ac.sliit.legacylens.learning.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.learning.dto.LessonProgressResponse;
import lk.ac.sliit.legacylens.learning.dto.QuizAnswerRequest;
import lk.ac.sliit.legacylens.learning.dto.QuizCompletionRequest;
import lk.ac.sliit.legacylens.learning.dto.QuizQuestionResponse;
import lk.ac.sliit.legacylens.learning.dto.QuizResult;
import lk.ac.sliit.legacylens.learning.dto.QuizSubmissionRequest;
import lk.ac.sliit.legacylens.learning.dto.QuizSubmissionResponse;
import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import lk.ac.sliit.legacylens.learning.entity.QuizQuestion;
import lk.ac.sliit.legacylens.learning.service.LessonProgressService;
import lk.ac.sliit.legacylens.learning.service.QuizQuestionService;
import lk.ac.sliit.legacylens.learning.review.WeakWordReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/learning")
public class QuizQuestionController {

	private final QuizQuestionService quizQuestionService;
	private final LessonProgressService lessonProgressService;
	private final WeakWordReviewService weakWordReviewService;

	public QuizQuestionController(
			QuizQuestionService quizQuestionService,
			LessonProgressService lessonProgressService,
			WeakWordReviewService weakWordReviewService) {
		this.quizQuestionService = quizQuestionService;
		this.lessonProgressService = lessonProgressService;
		this.weakWordReviewService = weakWordReviewService;
	}

	@GetMapping("/lessons/{lessonId}/questions")
	public ResponseEntity<ApiResponse<List<QuizQuestionResponse>>> getQuestionsByLesson(
			@PathVariable Long lessonId) {
		List<QuizQuestionResponse> response = quizQuestionService
				.getQuestionsByLessonId(lessonId)
				.stream()
				.map(QuizQuestionResponse::fromEntity)
				.toList();

		return ResponseEntity.ok(ApiResponse.ok(response));
	}

	@GetMapping("/questions/{id}")
	public ResponseEntity<ApiResponse<QuizQuestionResponse>> getQuestionById(
			@PathVariable Long id) {
		QuizQuestion question = quizQuestionService.getQuestionById(id);
		QuizQuestionResponse response = QuizQuestionResponse.fromEntity(question);

		return ResponseEntity.ok(ApiResponse.ok(response));
	}

	@PostMapping("/lessons/{lessonId}/questions")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<QuizQuestionResponse>> createQuestion(
			@PathVariable Long lessonId,
			@RequestBody QuizQuestion question) {
		QuizQuestion created = quizQuestionService.createQuestion(lessonId, question);
		QuizQuestionResponse response = QuizQuestionResponse.fromEntity(created);

		return ResponseEntity.ok(ApiResponse.ok("Quiz question created successfully", response));
	}

	@PutMapping("/questions/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<QuizQuestionResponse>> updateQuestion(
			@PathVariable Long id,
			@RequestBody QuizQuestion question) {
		QuizQuestion updated = quizQuestionService.updateQuestion(id, question);
		QuizQuestionResponse response = QuizQuestionResponse.fromEntity(updated);

		return ResponseEntity.ok(ApiResponse.ok("Quiz question updated successfully", response));
	}

	@DeleteMapping("/questions/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
		quizQuestionService.deleteQuestion(id);

		return ResponseEntity.noContent().build();
	}

	@PostMapping("/questions/{id}/answer")
	public ResponseEntity<ApiResponse<QuizResult>> checkAnswer(
			@PathVariable Long id,
			@Valid @RequestBody QuizAnswerRequest request) {
		QuizResult result = quizQuestionService.evaluateAnswer(id, request.getSelectedOption());

		return ResponseEntity.ok(ApiResponse.ok(result));
	}

	@PostMapping("/lessons/{lessonId}/submit")
	public ResponseEntity<ApiResponse<QuizSubmissionResponse>> submitQuiz(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long lessonId,
			@Valid @RequestBody QuizSubmissionRequest request) {
		UUID userId = principal.getUser().getId();
		List<QuizResult> results = quizQuestionService.evaluateAnswers(lessonId, request.getAnswers());
		int totalScore = quizQuestionService.calculateTotalScore(results);
		long totalQuestions = quizQuestionService.getQuestionCountForLesson(lessonId);
		LessonProgress progress = lessonProgressService.completeQuizLessonServerGraded(
				userId,
				lessonId,
				totalScore,
				totalQuestions
		);

		for (QuizResult res : results) {
			QuizQuestion qq = quizQuestionService.getQuestionById(res.getQuestionId());
			if (qq.getFlashcard() != null) {
				if (res.isCorrect()) {
					weakWordReviewService.recordCorrectAnswer(userId, qq.getFlashcard().getId());
				} else {
					weakWordReviewService.recordWrongAnswer(userId, qq.getFlashcard().getId());
				}
			}
		}

		QuizSubmissionResponse response = new QuizSubmissionResponse(
				results,
				totalScore,
				totalQuestions,
				progress.isCompleted(),
				progress.getXpEarned()
		);

		return ResponseEntity.ok(ApiResponse.ok("Quiz submitted successfully", response));
	}

	@PostMapping("/lessons/{lessonId}/complete")
	public ResponseEntity<ApiResponse<LessonProgressResponse>> completeLesson(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long lessonId,
			@Valid @RequestBody QuizCompletionRequest request) {
		UUID userId = principal.getUser().getId();
		LessonProgressResponse progressResponse = lessonProgressService.getProgressResponse(userId, lessonId)
				.orElseGet(() -> {
					LessonProgress lp = lessonProgressService.completeFlashcardLesson(userId, lessonId);
					return new LessonProgressResponse(lp.getLesson().getId(), lp.isCompleted(), lp.getScore(), lp.getXpEarned());
				});

		return ResponseEntity.ok(ApiResponse.ok(progressResponse));
	}
}