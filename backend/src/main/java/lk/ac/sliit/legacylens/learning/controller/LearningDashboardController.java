package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.learning.dto.LearningDashboardResponse;
import lk.ac.sliit.legacylens.learning.dto.NextLessonResponse;
import lk.ac.sliit.legacylens.learning.dto.TrackDashboardResponse;
import lk.ac.sliit.legacylens.learning.service.LearningDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/learning/dashboard")
public class LearningDashboardController {

	private final LearningDashboardService learningDashboardService;

	public LearningDashboardController(LearningDashboardService learningDashboardService) {
		this.learningDashboardService = learningDashboardService;
	}

	@GetMapping("/me")
	public ResponseEntity<LearningDashboardResponse> getMyDashboard(
			@AuthenticationPrincipal CustomUserDetails principal) {
		UUID userId = principal.getUser().getId();
		LearningDashboardResponse dashboard = learningDashboardService.getDashboard(userId);

		return ResponseEntity.ok(dashboard);
	}

	@GetMapping("/me/tracks/{trackId}")
	public ResponseEntity<TrackDashboardResponse> getMyTrackDashboard(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long trackId) {
		UUID userId = principal.getUser().getId();
		TrackDashboardResponse trackDashboard = learningDashboardService.getTrackDashboard(userId, trackId);

		return ResponseEntity.ok(trackDashboard);
	}

	@GetMapping("/me/tracks/{trackId}/next-lesson")
	public ResponseEntity<NextLessonResponse> getNextLesson(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long trackId) {
		UUID userId = principal.getUser().getId();
		NextLessonResponse nextLesson = learningDashboardService.getNextLesson(userId, trackId);

		return ResponseEntity.ok(nextLesson);
	}

	@GetMapping("/admin/users/{userId}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<LearningDashboardResponse> getUserDashboard(
			@PathVariable UUID userId) {
		LearningDashboardResponse dashboard = learningDashboardService.getDashboard(userId);

		return ResponseEntity.ok(dashboard);
	}
}