package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.learning.entity.Flashcard;
import lk.ac.sliit.legacylens.learning.service.FlashcardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learning")
public class FlashcardController {

    private final FlashcardService flashcardService;
    private final lk.ac.sliit.legacylens.common.storage.FileStorageService fileStorageService;

    public FlashcardController(FlashcardService flashcardService, lk.ac.sliit.legacylens.common.storage.FileStorageService fileStorageService) {
        this.flashcardService = flashcardService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/lessons/{lessonId}/flashcards")
    public ResponseEntity<List<Flashcard>> getFlashcardsByLesson(
            @PathVariable Long lessonId) {

        return ResponseEntity.ok(
                flashcardService.getFlashcardsByLessonId(lessonId)
        );
    }

    @GetMapping("/flashcards/{id}")
    public ResponseEntity<Flashcard> getFlashcardById(
            @PathVariable Long id) {

        return flashcardService.getFlashcardById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/lessons/{lessonId}/flashcards")
    public ResponseEntity<Flashcard> createFlashcard(
            @PathVariable Long lessonId,
            @RequestBody Flashcard flashcard) {

        return ResponseEntity.ok(
                flashcardService.createFlashcard(lessonId, flashcard)
        );
    }

    @PutMapping("/flashcards/{id}")
    public ResponseEntity<Flashcard> updateFlashcard(
            @PathVariable Long id,
            @RequestBody Flashcard flashcard) {
        return ResponseEntity.ok(flashcardService.updateFlashcard(id, flashcard));
    }

    @DeleteMapping("/flashcards/{id}")
    public ResponseEntity<Void> deleteFlashcard(@PathVariable Long id) {
        flashcardService.deleteFlashcard(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/flashcards/upload-audio")
    public ResponseEntity<?> uploadAudio(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            // Store in "audios" subfolder, max size 10MB, allowed audio types
            String path = fileStorageService.store(file, "audios", 
                java.util.Arrays.asList(
                    "audio/mpeg", 
                    "audio/mp4", 
                    "video/mp4", 
                    "audio/ogg", 
                    "audio/wav", 
                    "audio/x-wav", 
                    "audio/x-m4a", 
                    "audio/aac"
                ), 
                10 * 1024 * 1024);
            
            java.util.Map<String, String> response = new java.util.HashMap<>();
            response.put("audioUrl", path);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, String> error = new java.util.HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/flashcards/{id}/evaluate-pronunciation")
    public ResponseEntity<lk.ac.sliit.legacylens.learning.dto.PronunciationResult> evaluatePronunciation(
            @PathVariable Long id,
            @RequestParam("audio") org.springframework.web.multipart.MultipartFile audio) {
        
        return ResponseEntity.ok(
                flashcardService.evaluatePronunciation(id, audio)
        );
    }
}