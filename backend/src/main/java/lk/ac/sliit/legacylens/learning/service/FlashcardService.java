package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.learning.entity.Flashcard;
import lk.ac.sliit.legacylens.learning.repository.FlashcardRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;

    public FlashcardService(FlashcardRepository flashcardRepository) {
        this.flashcardRepository = flashcardRepository;
    }

    public List<Flashcard> getFlashcardsByLessonId(Long lessonId) {
        return flashcardRepository.findByLessonIdOrderByIdAsc(lessonId);
    }

    public Optional<Flashcard> getFlashcardById(Long id) {
        return flashcardRepository.findById(id);
    }

    public Flashcard createFlashcard(Flashcard flashcard) {
        return flashcardRepository.save(flashcard);
    }
}