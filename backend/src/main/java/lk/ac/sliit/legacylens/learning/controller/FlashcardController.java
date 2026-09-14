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

    public FlashcardController(FlashcardService flashcardService) {
        this.flashcardService = flashcardService;
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

    @PostMapping("/flashcards")
    public ResponseEntity<Flashcard> createFlashcard(
            @RequestBody Flashcard flashcard) {

        return ResponseEntity.ok(
                flashcardService.createFlashcard(flashcard)
        );
    }
}