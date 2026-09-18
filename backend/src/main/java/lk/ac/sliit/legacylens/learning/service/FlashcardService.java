package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.learning.dto.PronunciationResult;
import lk.ac.sliit.legacylens.learning.entity.Flashcard;
import lk.ac.sliit.legacylens.learning.repository.FlashcardRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.Random;

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

    public PronunciationResult evaluatePronunciation(Long flashcardId, MultipartFile audioFile) {
        if (audioFile == null || audioFile.isEmpty()) {
            return new PronunciationResult(false, 0, "No audio provided. Please try again.");
        }

        // Generate a random score between 50 and 100 for mock evaluation
        Random random = new Random();
        int score = random.nextInt(51) + 50; 
        
        boolean passed = score > 65;
        String feedback = passed 
                ? "Great job! Your pronunciation is very close." 
                : "Good attempt, but you can improve. Keep practicing!";

        return new PronunciationResult(passed, score, feedback);
    }
}