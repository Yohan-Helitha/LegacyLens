package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.learning.dto.PronunciationResult;
import lk.ac.sliit.legacylens.learning.entity.Flashcard;
import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.repository.FlashcardRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
public class FlashcardService {

	private static final Logger log = LoggerFactory.getLogger(FlashcardService.class);

	private final FlashcardRepository flashcardRepository;

	public FlashcardService(FlashcardRepository flashcardRepository) {
		this.flashcardRepository = flashcardRepository;
	}

	public List<Flashcard> getFlashcardsByLessonId(Long lessonId) {
		List<Flashcard> flashcards = flashcardRepository.findByLessonIdOrderByIdAsc(lessonId);

		return flashcards;
	}

	public Optional<Flashcard> getFlashcardById(Long id) {
		Optional<Flashcard> flashcard = flashcardRepository.findById(id);

		return flashcard;
	}

	@Transactional
	public Flashcard createFlashcard(Long lessonId, Flashcard flashcard) {
		Lesson lesson = new Lesson();
		Flashcard saved = null;

		lesson.setId(lessonId);
		flashcard.setLesson(lesson);
		saved = flashcardRepository.save(flashcard);

		return saved;
	}

	@Transactional
	public Flashcard updateFlashcard(Long id, Flashcard updatedFlashcard) {
		Flashcard saved = flashcardRepository.findById(id).map(existingFlashcard -> {
			existingFlashcard.setWord(updatedFlashcard.getWord());
			existingFlashcard.setMeaning(updatedFlashcard.getMeaning());
			existingFlashcard.setAudioUrl(updatedFlashcard.getAudioUrl());
			existingFlashcard.setCulturalNote(updatedFlashcard.getCulturalNote());
			existingFlashcard.setRecordedBy(updatedFlashcard.getRecordedBy());
			return flashcardRepository.save(existingFlashcard);
		}).orElseThrow(() -> new ResourceNotFoundException("Flashcard not found"));

		return saved;
	}

	@Transactional
	public void deleteFlashcard(Long id) {
		if (!flashcardRepository.existsById(id)) {
			throw new ResourceNotFoundException("Flashcard not found");
		}

		flashcardRepository.deleteById(id);
	}

	/**
	 * Record and playback practice: validates user audio receipt and provides supportive
	 * feedback without misleading English-only algorithmic scoring on Sinhala dialect words.
	 */
	public PronunciationResult evaluatePronunciation(Long flashcardId, MultipartFile audioFile) {
		Flashcard flashcard = null;
		PronunciationResult result = null;

		if (audioFile == null || audioFile.isEmpty()) {
			return new PronunciationResult(false, 0, "No audio provided. Please record your pronunciation.");
		}

		flashcard = flashcardRepository.findById(flashcardId)
				.orElseThrow(() -> new ResourceNotFoundException("Flashcard not found"));

		log.debug("User practiced pronunciation for flashcard ID: {}", flashcardId);

		result = new PronunciationResult(
				true,
				100,
				"Recording captured! Listen back and compare with the elder's reference audio."
		);

		return result;
	}
}