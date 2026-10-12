package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.learning.admin.dto.AdminGeneratedTrackPreviewDto;
import lk.ac.sliit.legacylens.learning.admin.dto.AdminPublishTrackRequest;
import lk.ac.sliit.legacylens.learning.admin.dto.AdminTrackGenerationRequest;
import lk.ac.sliit.legacylens.learning.admin.service.AdminTrackGenerationService;
import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.service.LearningTrackService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/learning/tracks")
public class LearningTrackController {

	private final LearningTrackService learningTrackService;
	private final AdminTrackGenerationService adminTrackGenerationService;

	public LearningTrackController(
			LearningTrackService learningTrackService,
			AdminTrackGenerationService adminTrackGenerationService) {
		this.learningTrackService = learningTrackService;
		this.adminTrackGenerationService = adminTrackGenerationService;
	}

	@GetMapping
	public ResponseEntity<List<LearningTrack>> getAllTracks() {
		List<LearningTrack> tracks = learningTrackService.getAllTracks();

		return ResponseEntity.ok(tracks);
	}

	@GetMapping("/{id}")
	public ResponseEntity<LearningTrack> getTrackById(@PathVariable Long id) {
		LearningTrack track = learningTrackService.getTrackById(id).orElse(null);

		if (track == null) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(track);
	}

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<LearningTrack> createTrack(@RequestBody LearningTrack learningTrack) {
		LearningTrack created = learningTrackService.createTrack(learningTrack);

		return ResponseEntity.ok(created);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<LearningTrack> updateTrack(
			@PathVariable Long id,
			@RequestBody LearningTrack learningTrack) {
		LearningTrack updated = learningTrackService.updateTrack(id, learningTrack);

		return ResponseEntity.ok(updated);
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Void> deleteTrack(@PathVariable Long id) {
		learningTrackService.deleteTrack(id);

		return ResponseEntity.noContent().build();
	}

	@PostMapping("/admin/ai-preview")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<AdminGeneratedTrackPreviewDto>> generateTrackPreview(
			@Valid @RequestBody AdminTrackGenerationRequest request) {
		AdminGeneratedTrackPreviewDto preview = adminTrackGenerationService.generatePreview(request);

		return ResponseEntity.ok(ApiResponse.ok("Curriculum preview generated successfully", preview));
	}

	@PostMapping("/admin/ai-publish")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<LearningTrack>> publishGeneratedTrack(
			@Valid @RequestBody AdminPublishTrackRequest request) {
		LearningTrack savedTrack = adminTrackGenerationService.publishTrack(request);

		return ResponseEntity.ok(ApiResponse.ok("Learning track and curriculum published successfully", savedTrack));
	}

	@PostMapping("/admin/repair-legacy")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<String>> repairLegacyLessons() {
		adminTrackGenerationService.repairLegacyCultureLessons();
		return ResponseEntity.ok(ApiResponse.ok("Legacy lessons successfully repaired into pure FLASHCARDS and QUIZ lessons", "OK"));
	}
}