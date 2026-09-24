package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.learning.dto.PronunciationResult;
import lk.ac.sliit.legacylens.learning.entity.Flashcard;
import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.repository.FlashcardRepository;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ws.schild.jave.Encoder;
import ws.schild.jave.MultimediaObject;
import ws.schild.jave.encode.AudioAttributes;
import ws.schild.jave.encode.EncodingAttributes;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.vosk.Model;
import org.vosk.Recognizer;
import jakarta.annotation.PostConstruct;

import java.io.File;
import java.nio.file.Files;
import java.util.List;
import java.util.Optional;

@Service
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private Model voskModel;

    public FlashcardService(FlashcardRepository flashcardRepository) {
        this.flashcardRepository = flashcardRepository;
    }

    @PostConstruct
    public void initVosk() {
        try {
            String path = "models/vosk-model-small-en-us-0.15";
            if (!new java.io.File(path).exists()) {
                path = "backend/models/vosk-model-small-en-us-0.15";
            }
            if (!new java.io.File(path).exists()) {
                // Fallback to absolute path based on user directory
                String userDir = System.getProperty("user.dir");
                path = userDir + "/backend/models/vosk-model-small-en-us-0.15";
                if (!new java.io.File(path).exists()) {
                    path = userDir + "/models/vosk-model-small-en-us-0.15";
                }
            }
            
            System.out.println("Loading Vosk model from: " + path);
            voskModel = new Model(path);
            System.out.println("Vosk model loaded successfully.");
        } catch (Exception e) {
            System.err.println("Failed to load Vosk model: " + e.getMessage());
        }
    }

    public List<Flashcard> getFlashcardsByLessonId(Long lessonId) {
        return flashcardRepository.findByLessonIdOrderByIdAsc(lessonId);
    }

    public Optional<Flashcard> getFlashcardById(Long id) {
        return flashcardRepository.findById(id);
    }

    public Flashcard createFlashcard(Long lessonId, Flashcard flashcard) {
        Lesson lesson = new Lesson();
        lesson.setId(lessonId);
        flashcard.setLesson(lesson);
        return flashcardRepository.save(flashcard);
    }

    public Flashcard updateFlashcard(Long id, Flashcard updatedFlashcard) {
        return flashcardRepository.findById(id).map(existingFlashcard -> {
            existingFlashcard.setWord(updatedFlashcard.getWord());
            existingFlashcard.setMeaning(updatedFlashcard.getMeaning());
            existingFlashcard.setAudioUrl(updatedFlashcard.getAudioUrl());
            existingFlashcard.setCulturalNote(updatedFlashcard.getCulturalNote());
            existingFlashcard.setRecordedBy(updatedFlashcard.getRecordedBy());
            return flashcardRepository.save(existingFlashcard);
        }).orElseThrow(() -> new ResourceNotFoundException("Flashcard not found"));
    }

    public void deleteFlashcard(Long id) {
        if (!flashcardRepository.existsById(id)) {
            throw new ResourceNotFoundException("Flashcard not found");
        }
        flashcardRepository.deleteById(id);
    }

    public PronunciationResult evaluatePronunciation(Long flashcardId, MultipartFile audioFile) {
        if (audioFile == null || audioFile.isEmpty()) {
            return new PronunciationResult(false, 0, "No audio provided. Please try again.");
        }

        Flashcard flashcard = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard not found"));

        if (voskModel == null) {
            return new PronunciationResult(false, 0, "Speech recognition model is not loaded.");
        }

        File tempInputFile = null;
        File tempOutputFile = null;

        try {
            tempInputFile = File.createTempFile("audio_in_", ".m4a");
            audioFile.transferTo(tempInputFile);

            tempOutputFile = File.createTempFile("audio_out_", ".wav");
            
            AudioAttributes audio = new AudioAttributes();
            audio.setCodec("pcm_s16le");
            audio.setBitRate(256000);
            audio.setChannels(1);
            audio.setSamplingRate(16000);

            EncodingAttributes attrs = new EncodingAttributes();
            attrs.setOutputFormat("wav");
            attrs.setAudioAttributes(audio);

            Encoder encoder = new Encoder();
            encoder.encode(new MultimediaObject(tempInputFile), tempOutputFile, attrs);

            String transcribedText = "";
            try (Recognizer recognizer = new Recognizer(voskModel, 16000)) {
                byte[] audioBytes = Files.readAllBytes(tempOutputFile.toPath());
                recognizer.acceptWaveForm(audioBytes, audioBytes.length);
                String result = recognizer.getFinalResult();
                JsonNode root = objectMapper.readTree(result);
                transcribedText = root.path("text").asText();
            }

            String referenceText = flashcard.getWord();
            int score = calculateSimilarity(referenceText, transcribedText);
            boolean passed = score >= 65;
            String feedback = passed 
                    ? "Great job! Your pronunciation is close. Score: " + score
                    : "Good attempt, but you can improve. Score: " + score;
            return new PronunciationResult(passed, score, feedback);

        } catch (Exception e) {
            e.printStackTrace();
            return new PronunciationResult(false, 0, "Error evaluating pronunciation.");
        } finally {
            if (tempInputFile != null && tempInputFile.exists()) tempInputFile.delete();
            if (tempOutputFile != null && tempOutputFile.exists()) tempOutputFile.delete();
        }
    }

    private int calculateSimilarity(String s1, String s2) {
        String longer = s1.toLowerCase().replaceAll("[^a-z]", ""), shorter = s2.toLowerCase().replaceAll("[^a-z]", "");
        if (longer.length() < shorter.length()) { 
            String temp = longer; longer = shorter; shorter = temp;
        }
        int longerLength = longer.length();
        if (longerLength == 0) return 100;
        return (int) (((longerLength - editDistance(longer, shorter)) / (double) longerLength) * 100);
    }

    private int editDistance(String s1, String s2) {
        int[] costs = new int[s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) {
            int lastValue = i;
            for (int j = 0; j <= s2.length(); j++) {
                if (i == 0) costs[j] = j;
                else {
                    if (j > 0) {
                        int newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[s2.length()] = lastValue;
        }
        return costs[s2.length()];
    }
}