package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.service.LessonService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learning")
public class LessonController {

	private final LessonService lessonService;

	public LessonController(LessonService lessonService) {
		this.lessonService = lessonService;
	}

	@GetMapping("/tracks/{trackId}/lessons")
	public ResponseEntity<List<Lesson>> getLessonsByTrack(@PathVariable Long trackId) {
		List<Lesson> lessons = lessonService.getLessonsByTrackId(trackId);

		return ResponseEntity.ok(lessons);
	}

	@GetMapping("/lessons/{id}")
	public ResponseEntity<Lesson> getLessonById(@PathVariable Long id) {
		Lesson lesson = lessonService.getLessonById(id);

		return ResponseEntity.ok(lesson);
	}

	@PostMapping("/lessons")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Lesson> createLesson(
			@RequestParam Long trackId,
			@RequestBody Lesson lesson) {
		Lesson created = lessonService.createLesson(trackId, lesson);

		return ResponseEntity.ok(created);
	}

	@PutMapping("/lessons/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Lesson> updateLesson(
			@PathVariable Long id,
			@RequestBody Lesson lesson) {
		Lesson updated = lessonService.updateLesson(id, lesson);

		return ResponseEntity.ok(updated);
	}

	@DeleteMapping("/lessons/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Void> deleteLesson(@PathVariable Long id) {
		lessonService.deleteLesson(id);

		return ResponseEntity.noContent().build();
	}
}