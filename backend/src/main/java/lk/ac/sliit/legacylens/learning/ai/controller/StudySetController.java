package lk.ac.sliit.legacylens.learning.ai.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.learning.ai.dto.StudyAttemptResultResponse;
import lk.ac.sliit.legacylens.learning.ai.dto.StudySetDetailResponse;
import lk.ac.sliit.legacylens.learning.ai.dto.StudySetSummaryResponse;
import lk.ac.sliit.legacylens.learning.ai.dto.SubmitStudyAttemptRequest;
import lk.ac.sliit.legacylens.learning.ai.service.StudySetService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/learning/study-sets")
public class StudySetController {

	private final StudySetService studySetService;

	public StudySetController(StudySetService studySetService) {
		this.studySetService = studySetService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<StudySetSummaryResponse>>> getMyStudySets(
			@AuthenticationPrincipal CustomUserDetails principal) {
		UUID userId = principal.getUser().getId();
		List<StudySetSummaryResponse> sets = studySetService.getMyStudySets(userId);

		return ResponseEntity.ok(ApiResponse.ok(sets));
	}

	@GetMapping("/{trackId}")
	public ResponseEntity<ApiResponse<StudySetDetailResponse>> getMyStudySetDetail(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long trackId) {
		UUID userId = principal.getUser().getId();
		StudySetDetailResponse detail = studySetService.getMyStudySetDetail(userId, trackId);

		return ResponseEntity.ok(ApiResponse.ok(detail));
	}

	@DeleteMapping("/{trackId}")
	public ResponseEntity<ApiResponse<Void>> deleteMyStudySet(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long trackId) {
		UUID userId = principal.getUser().getId();

		studySetService.deleteMyStudySet(userId, trackId);

		return ResponseEntity.ok(ApiResponse.ok("Study set deleted successfully", null));
	}

	@PostMapping("/{trackId}/attempts")
	public ResponseEntity<ApiResponse<StudyAttemptResultResponse>> submitQuizAttempt(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long trackId,
			@Valid @RequestBody SubmitStudyAttemptRequest request) {
		UUID userId = principal.getUser().getId();
		StudyAttemptResultResponse result = studySetService.submitQuizAttempt(userId, trackId, request);

		return ResponseEntity.ok(ApiResponse.ok("Quiz attempt submitted", result));
	}
}
