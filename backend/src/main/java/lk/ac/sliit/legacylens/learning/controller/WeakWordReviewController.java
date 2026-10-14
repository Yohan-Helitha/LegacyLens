package lk.ac.sliit.legacylens.learning.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.learning.dto.*;
import lk.ac.sliit.legacylens.learning.review.WeakWordReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/learning/review")
public class WeakWordReviewController {

	private final WeakWordReviewService weakWordReviewService;

	public WeakWordReviewController(WeakWordReviewService weakWordReviewService) {
		this.weakWordReviewService = weakWordReviewService;
	}

	@GetMapping("/weak-words")
	public ResponseEntity<ApiResponse<List<WeakWordSummaryResponse>>> getMyWeakWords(
			@AuthenticationPrincipal CustomUserDetails principal) {
		UUID userId = principal.getUser().getId();
		List<WeakWordSummaryResponse> responses = weakWordReviewService.getMyWeakWords(userId);

		return ResponseEntity.ok(ApiResponse.ok(responses));
	}

	@PostMapping("/session")
	public ResponseEntity<ApiResponse<ReviewSessionResponse>> buildReviewSession(
			@AuthenticationPrincipal CustomUserDetails principal,
			@RequestBody(required = false) BuildReviewSessionRequest request) {
		UUID userId = principal.getUser().getId();
		int limit = request != null && request.getLimit() != null ? request.getLimit() : 5;
		ReviewSessionResponse response = weakWordReviewService.buildReviewSession(userId, limit);

		return ResponseEntity.ok(ApiResponse.ok(response));
	}

	@PostMapping("/session/answers")
	public ResponseEntity<ApiResponse<ReviewResultResponse>> submitReviewAnswers(
			@AuthenticationPrincipal CustomUserDetails principal,
			@Valid @RequestBody SubmitReviewAnswersRequest request) {
		UUID userId = principal.getUser().getId();
		ReviewResultResponse response = weakWordReviewService.submitReviewAnswers(userId, request);

		return ResponseEntity.ok(ApiResponse.ok(response));
	}
}
