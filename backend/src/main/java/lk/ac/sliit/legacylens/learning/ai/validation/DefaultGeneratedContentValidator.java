package lk.ac.sliit.legacylens.learning.ai.validation;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.learning.ai.prompt.PromptOptions;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.*;

@Component
public class DefaultGeneratedContentValidator implements GeneratedContentValidator {

	private static final Logger log = LoggerFactory.getLogger(DefaultGeneratedContentValidator.class);

	private final ObjectMapper objectMapper;
	private final int minValidItems;

	public DefaultGeneratedContentValidator(
			ObjectMapper objectMapper,
			@Value("${app.learning.builder.min-valid-items:3}") int minValidItems) {
		this.objectMapper = objectMapper;
		this.minValidItems = minValidItems > 0 ? minValidItems : 3;
	}

	@Override
	public ValidationResult validate(String rawJson, List<SourceContent> sources, PromptOptions options) {
		String cleanJson = stripMarkdownEnvelopes(rawJson);
		GeneratedStudySet rawSet = null;
		Map<String, String> normalizedSourceMap = new HashMap<>();
		StringBuilder allSourcesBuilder = new StringBuilder();
		String combinedSourceText = "";
		List<GeneratedStudySet.GeneratedFlashcard> validFlashcards = new ArrayList<>();
		List<GeneratedStudySet.GeneratedQuizQuestion> validQuestions = new ArrayList<>();
		int droppedFlashcards = 0;
		int droppedQuestions = 0;
		ValidationResult result = null;

		if (cleanJson == null || cleanJson.isBlank()) {
			return ValidationResult.builder()
					.valid(false)
					.failureReason("Generated output was empty")
					.build();
		}

		try {
			rawSet = objectMapper.readValue(cleanJson, GeneratedStudySet.class);
		} catch (Exception parseEx) {
			log.warn("Failed to parse AI output into GeneratedStudySet: {}", parseEx.getMessage());
			return ValidationResult.builder()
					.valid(false)
					.failureReason("Malformed JSON from AI model: " + parseEx.getMessage())
					.build();
		}

		if (sources != null) {
			for (SourceContent sc : sources) {
				String norm = normalizeUnicode(sc.getText() != null ? sc.getText() : "");
				normalizedSourceMap.put(sc.getId(), norm);
				allSourcesBuilder.append(norm).append(" ");
			}
		}
		combinedSourceText = allSourcesBuilder.toString();

		// Validate Flashcards
		if (rawSet.getFlashcards() != null) {
			for (GeneratedStudySet.GeneratedFlashcard fc : rawSet.getFlashcards()) {
				String word = fc.getWord() != null ? fc.getWord().trim() : "";
				String normWord = normalizeUnicode(word);
				String sourceId = fc.getSourceContentId();
				String sourceText = sourceId != null && normalizedSourceMap.containsKey(sourceId)
						? normalizedSourceMap.get(sourceId)
						: combinedSourceText;
				boolean wordGrounded = false;
				boolean evidenceGrounded = true;

				if (word.isBlank() || normWord.isBlank()) {
					droppedFlashcards++;
					continue;
				}

				wordGrounded = sourceText.contains(normWord);

				if (fc.getEvidence() != null && !fc.getEvidence().isBlank()) {
					String normEvidence = normalizeUnicode(fc.getEvidence());
					evidenceGrounded = sourceText.contains(normEvidence);
				}

				if (wordGrounded && evidenceGrounded) {
					validFlashcards.add(fc);
				} else {
					log.debug("Dropping ungrounded flashcard word: '{}' (evidence valid: {})", word, evidenceGrounded);
					droppedFlashcards++;
				}
			}
		}

		// Validate Quiz Questions
		if (rawSet.getQuizQuestions() != null) {
			for (GeneratedStudySet.GeneratedQuizQuestion q : rawSet.getQuizQuestions()) {
				String questionText = q.getQuestion() != null ? q.getQuestion().trim() : "";
				String optA = q.getOptionA() != null ? q.getOptionA().trim() : "";
				String optB = q.getOptionB() != null ? q.getOptionB().trim() : "";
				String optC = q.getOptionC() != null ? q.getOptionC().trim() : "";
				String optD = q.getOptionD() != null ? q.getOptionD().trim() : "";
				String correctOpt = q.getCorrectOption() != null ? q.getCorrectOption().trim().toUpperCase() : "";
				String sourceId = q.getSourceContentId();
				String sourceText = sourceId != null && normalizedSourceMap.containsKey(sourceId)
						? normalizedSourceMap.get(sourceId)
						: combinedSourceText;
				boolean hasAllOptions = false;
				boolean noDuplicates = false;
				boolean validCorrectOption = false;
				boolean evidenceGrounded = true;

				if (questionText.isBlank()) {
					droppedQuestions++;
					continue;
				}

				hasAllOptions = !optA.isBlank() && !optB.isBlank() && !optC.isBlank() && !optD.isBlank();
				validCorrectOption = Set.of("A", "B", "C", "D").contains(correctOpt);

				Set<String> uniqueOptions = new HashSet<>();
				uniqueOptions.add(optA.toLowerCase());
				uniqueOptions.add(optB.toLowerCase());
				uniqueOptions.add(optC.toLowerCase());
				uniqueOptions.add(optD.toLowerCase());
				noDuplicates = uniqueOptions.size() == 4;

				if (q.getEvidence() != null && !q.getEvidence().isBlank()) {
					String normEvidence = normalizeUnicode(q.getEvidence());
					evidenceGrounded = sourceText.contains(normEvidence);
				}

				if (hasAllOptions && validCorrectOption && noDuplicates && evidenceGrounded) {
					q.setCorrectOption(correctOpt);
					validQuestions.add(q);
				} else {
					log.debug("Dropping invalid quiz question: '{}' (evidence valid: {}, noDuplicates: {})",
							questionText, evidenceGrounded, noDuplicates);
					droppedQuestions++;
				}
			}
		}

		// Check Minimum Count Requirements
		if (options.isIncludeFlashcards() && validFlashcards.size() < minValidItems) {
			return ValidationResult.builder()
					.valid(false)
					.failureReason("Fewer than " + minValidItems + " grounded flashcards could be verified from the source text")
					.droppedFlashcardsCount(droppedFlashcards)
					.droppedQuestionsCount(droppedQuestions)
					.build();
		}

		if (options.isIncludeQuiz() && validQuestions.size() < minValidItems) {
			return ValidationResult.builder()
					.valid(false)
					.failureReason("Fewer than " + minValidItems + " grounded quiz questions could be verified from the source text")
					.droppedFlashcardsCount(droppedFlashcards)
					.droppedQuestionsCount(droppedQuestions)
					.build();
		}

		rawSet.setFlashcards(validFlashcards);
		rawSet.setQuizQuestions(validQuestions);

		result = ValidationResult.builder()
				.valid(true)
				.studySet(rawSet)
				.droppedFlashcardsCount(droppedFlashcards)
				.droppedQuestionsCount(droppedQuestions)
				.build();

		return result;
	}

	private String stripMarkdownEnvelopes(String raw) {
		String trimmed = null;

		if (raw == null) {
			return "";
		}

		trimmed = raw.trim();
		if (trimmed.startsWith("```json")) {
			trimmed = trimmed.substring(7);
		} else if (trimmed.startsWith("```")) {
			trimmed = trimmed.substring(3);
		}

		if (trimmed.endsWith("```")) {
			trimmed = trimmed.substring(0, trimmed.length() - 3);
		}

		return trimmed.trim();
	}

	private String normalizeUnicode(String text) {
		String normalized = "";

		if (text == null) {
			return "";
		}

		normalized = Normalizer.normalize(text, Normalizer.Form.NFC)
				.toLowerCase()
				.replaceAll("\\s+", " ")
				.trim();

		return normalized;
	}
}
