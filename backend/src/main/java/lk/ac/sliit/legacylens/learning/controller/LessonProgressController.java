package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.learning.dto.LessonProgressResponse;
import lk.ac.sliit.legacylens.learning.dto.ProgressSummaryResponse;
import lk.ac.sliit.legacylens.learning.dto.StreakResponse;
import lk.ac.sliit.legacylens.learning.dto.TrackProgressResponse;
import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import lk.ac.sliit.legacylens.learning.progress.ProgressSummaryService;
import lk.ac.sliit.legacylens.learning.service.LessonProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/learning/progress")
public class LessonProgressController {

	private final LessonProgressService lessonProgressService;
	private final ProgressSummaryService progressSummaryService;

	public LessonProgressController(
			LessonProgressService lessonProgressService,
			ProgressSummaryService progressSummaryService) {
		this.lessonProgressService = lessonProgressService;
		this.progressSummaryService = progressSummaryService;
	}

	@GetMapping("/me/summary")
	public ResponseEntity<ApiResponse<ProgressSummaryResponse>> getMySummary(
			@AuthenticationPrincipal CustomUserDetails principal) {
		UUID userId = principal.getUser().getId();
		ProgressSummaryResponse summary = progressSummaryService.getProgressSummary(userId);

		return ResponseEntity.ok(ApiResponse.ok(summary));
	}

	@GetMapping("/me")
	public ResponseEntity<ApiResponse<List<LessonProgressResponse>>> getMyProgress(
			@AuthenticationPrincipal CustomUserDetails principal) {
		UUID userId = principal.getUser().getId();
		List<LessonProgressResponse> progress = lessonProgressService.getUserProgressResponse(userId);

		return ResponseEntity.ok(ApiResponse.ok(progress));
	}

	@GetMapping("/me/lessons/{lessonId}")
	public ResponseEntity<ApiResponse<LessonProgressResponse>> getMyLessonProgress(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long lessonId) {
		UUID userId = principal.getUser().getId();
		LessonProgressResponse response = lessonProgressService
				.getProgressResponse(userId, lessonId)
				.orElse(null);

		if (response == null) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(ApiResponse.ok(response));
	}

	@PostMapping("/me/lessons/{lessonId}/complete")
	public ResponseEntity<ApiResponse<LessonProgressResponse>> completeLesson(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long lessonId) {
		UUID userId = principal.getUser().getId();
		LessonProgress progress = lessonProgressService.completeFlashcardLesson(userId, lessonId);
		LessonProgressResponse response = new LessonProgressResponse(
				progress.getLesson().getId(),
				progress.isCompleted(),
				progress.getScore(),
				progress.getXpEarned()
		);

		return ResponseEntity.ok(ApiResponse.ok("Lesson completed successfully", response));
	}

	@GetMapping("/tracks/me")
	public ResponseEntity<ApiResponse<List<TrackProgressResponse>>> getMyTrackProgress(
			@AuthenticationPrincipal CustomUserDetails principal) {
		UUID userId = principal.getUser().getId();
		List<TrackProgressResponse> trackProgress = lessonProgressService.getUserTrackProgress(userId);

		return ResponseEntity.ok(ApiResponse.ok(trackProgress));
	}

	@GetMapping("/me/streak")
	public ResponseEntity<ApiResponse<StreakResponse>> getMyStreak(
			@AuthenticationPrincipal CustomUserDetails principal) {
		UUID userId = principal.getUser().getId();
		StreakResponse streak = lessonProgressService.getStreak(userId);

		return ResponseEntity.ok(ApiResponse.ok(streak));
	}

	@GetMapping("/{userId}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<List<LessonProgressResponse>>> getAdminUserProgress(
			@PathVariable UUID userId) {
		List<LessonProgressResponse> progress = lessonProgressService.getUserProgressResponse(userId);

		return ResponseEntity.ok(ApiResponse.ok(progress));
	}
}