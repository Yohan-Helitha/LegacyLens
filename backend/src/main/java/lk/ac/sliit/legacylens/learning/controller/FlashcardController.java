package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.common.exception.InvalidFileUploadException;
import lk.ac.sliit.legacylens.common.storage.MediaStorageService;
import lk.ac.sliit.legacylens.learning.dto.PronunciationResult;
import lk.ac.sliit.legacylens.learning.entity.Flashcard;
import lk.ac.sliit.legacylens.learning.service.FlashcardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/learning")
public class FlashcardController {

	/** The Supabase bucket flashcard audio lives in (created public, so the URL plays straight in the app). */
	static final String AUDIO_BUCKET = "Legacy Lens";
	static final String AUDIO_SUBFOLDER = "flashcard-audio";
	private static final long MAX_AUDIO_BYTES = 10L * 1024 * 1024;
	private static final List<String> ALLOWED_AUDIO_TYPES = Arrays.asList(
			"audio/mpeg",
			"audio/mp3",
			"audio/mp4",
			"video/mp4",
			"audio/ogg",
			"audio/wav",
			"audio/x-wav",
			"audio/x-m4a",
			"audio/m4a",
			"audio/aac");

	private final FlashcardService flashcardService;
	private final MediaStorageService mediaStorageService;

	public FlashcardController(
			FlashcardService flashcardService,
			MediaStorageService mediaStorageService) {
		this.flashcardService = flashcardService;
		this.mediaStorageService = mediaStorageService;
	}

	@GetMapping("/lessons/{lessonId}/flashcards")
	public ResponseEntity<List<Flashcard>> getFlashcardsByLesson(@PathVariable Long lessonId) {
		List<Flashcard> flashcards = flashcardService.getFlashcardsByLessonId(lessonId);

		return ResponseEntity.ok(flashcards);
	}

	@GetMapping("/flashcards/{id}")
	public ResponseEntity<Flashcard> getFlashcardById(@PathVariable Long id) {
		Flashcard flashcard = flashcardService.getFlashcardById(id).orElse(null);

		if (flashcard == null) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(flashcard);
	}

	@PostMapping("/lessons/{lessonId}/flashcards")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Flashcard> createFlashcard(
			@PathVariable Long lessonId,
			@RequestBody Flashcard flashcard) {
		Flashcard created = flashcardService.createFlashcard(lessonId, flashcard);

		return ResponseEntity.ok(created);
	}

	@PutMapping("/flashcards/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Flashcard> updateFlashcard(
			@PathVariable Long id,
			@RequestBody Flashcard flashcard) {
		Flashcard updated = flashcardService.updateFlashcard(id, flashcard);

		return ResponseEntity.ok(updated);
	}

	@DeleteMapping("/flashcards/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Void> deleteFlashcard(@PathVariable Long id) {
		flashcardService.deleteFlashcard(id);

		return ResponseEntity.noContent().build();
	}

	@PostMapping("/flashcards/upload-audio")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<?> uploadAudio(@RequestParam("file") MultipartFile file) {
		try {
			if (file == null || file.isEmpty()) {
				throw new InvalidFileUploadException("An audio file is required");
			}
			if (file.getSize() > MAX_AUDIO_BYTES) {
				throw new InvalidFileUploadException("Audio must not exceed " + (MAX_AUDIO_BYTES / (1024 * 1024)) + "MB");
			}
			String contentType = file.getContentType();
			if (contentType == null || !ALLOWED_AUDIO_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
				throw new InvalidFileUploadException("Only MP3 or MP4 audio files are allowed");
			}
			// Full playable URL: Supabase public URL when app.storage.provider=supabase, otherwise /uploads/... on local disk.
			String path = mediaStorageService.store(file, AUDIO_BUCKET, AUDIO_SUBFOLDER);
			Map<String, String> response = new HashMap<>();
			response.put("audioUrl", path);

			return ResponseEntity.ok(response);
		} catch (Exception e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());

			return ResponseEntity.badRequest().body(error);
		}
	}

	@PostMapping("/flashcards/{id}/evaluate-pronunciation")
	public ResponseEntity<ApiResponse<PronunciationResult>> evaluatePronunciation(
			@PathVariable Long id,
			@RequestParam("audio") MultipartFile audio) {
		PronunciationResult result = flashcardService.evaluatePronunciation(id, audio);

		return ResponseEntity.ok(ApiResponse.ok(result));
	}
}