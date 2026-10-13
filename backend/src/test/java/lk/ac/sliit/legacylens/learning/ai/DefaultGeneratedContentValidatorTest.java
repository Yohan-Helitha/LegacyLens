package lk.ac.sliit.legacylens.learning.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.learning.ai.prompt.PromptOptions;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContent;
import lk.ac.sliit.legacylens.learning.ai.validation.DefaultGeneratedContentValidator;
import lk.ac.sliit.legacylens.learning.ai.validation.GeneratedContentValidator;
import lk.ac.sliit.legacylens.learning.ai.validation.ValidationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.text.Normalizer;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DefaultGeneratedContentValidatorTest {

	private GeneratedContentValidator validator;
	private ObjectMapper objectMapper;

	@BeforeEach
	void setUp() {
		objectMapper = new ObjectMapper();
		validator = new DefaultGeneratedContentValidator(objectMapper, 3);
	}

	@Test
	@DisplayName("Rejects malformed or non-JSON string")
	void testMalformedJson() {
		SourceContent source = SourceContent.builder().id("1").title("T").text("Some text").build();
		PromptOptions options = PromptOptions.builder().includeQuiz(true).includeFlashcards(true).build();
		ValidationResult result = validator.validate("NOT A VALID JSON", List.of(source), options);

		assertFalse(result.isValid());
		assertTrue(result.getFailureReason().contains("Malformed JSON"));
	}

	@Test
	@DisplayName("Drops flashcards whose word or evidence is not in source text")
	void testUngroundedFlashcardDropped() {
		String sourceText = "Traditional mask carvers in Ambalangoda use kaduru wood for durable figures.";
		SourceContent source = SourceContent.builder().id("s1").title("Masks").text(sourceText).build();
		PromptOptions options = PromptOptions.builder().includeQuiz(false).includeFlashcards(true).build();

		String json = """
			{
			  "courseTitle": "Ambalangoda Masks",
			  "courseDescription": "Traditions of mask making",
			  "flashcards": [
			    { "word": "kaduru", "meaning": "Light soft wood", "evidence": "use kaduru wood", "sourceContentId": "s1" },
			    { "word": "hallucinated_term", "meaning": "Fake", "evidence": "never said this", "sourceContentId": "s1" }
			  ]
			}
			""";

		ValidationResult result = validator.validate(json, List.of(source), options);

		// With min items = 3, only 1 valid item causes failure
		assertFalse(result.isValid());
		assertEquals(1, result.getDroppedFlashcardsCount());
	}

	@Test
	@DisplayName("Drops quiz questions with duplicate options")
	void testQuizWithDuplicateOptionsDropped() {
		String sourceText = "Lace making in Galle Fort uses delicate wooden bobbins.";
		SourceContent source = SourceContent.builder().id("s1").title("Galle").text(sourceText).build();
		PromptOptions options = PromptOptions.builder().includeQuiz(true).includeFlashcards(false).build();

		String json = """
			{
			  "courseTitle": "Galle Lace",
			  "quizQuestions": [
			    {
			      "question": "What tools are used?",
			      "optionA": "Bobbins",
			      "optionB": "Bobbins",
			      "optionC": "Needles",
			      "optionD": "Hammers",
			      "correctOption": "A",
			      "evidence": "uses delicate wooden bobbins",
			      "sourceContentId": "s1"
			    }
			  ]
			}
			""";

		ValidationResult result = validator.validate(json, List.of(source), options);

		assertFalse(result.isValid());
		assertEquals(1, result.getDroppedQuestionsCount());
	}

	@Test
	@DisplayName("Properly matches Sinhala text across different Unicode decomposed forms (NFD vs NFC)")
	void testSinhalaUnicodeNormalization() {
		// Sinhala text in NFD decomposed form
		String nfdText = Normalizer.normalize("අම්බලන්ගොඩ වෙස් මුහුණු", Normalizer.Form.NFD);
		String nfcWord = Normalizer.normalize("වෙස් මුහුණු", Normalizer.Form.NFC);

		SourceContent source = SourceContent.builder().id("s1").title("Sin").text(nfdText).build();
		GeneratedContentValidator singleItemValidator = new DefaultGeneratedContentValidator(objectMapper, 1);
		PromptOptions options = PromptOptions.builder().includeQuiz(false).includeFlashcards(true).build();

		String json = """
			{
			  "courseTitle": "Sinhala Course",
			  "flashcards": [
			    { "word": "%s", "meaning": "Traditional masks", "evidence": "%s", "sourceContentId": "s1" }
			  ]
			}
			""".formatted(nfcWord, nfcWord);

		ValidationResult result = singleItemValidator.validate(json, List.of(source), options);

		assertTrue(result.isValid());
		assertEquals(1, result.getStudySet().getFlashcards().size());
		assertEquals(0, result.getDroppedFlashcardsCount());
	}

	@Test
	@DisplayName("Passes fully grounded study set satisfying minimum item counts")
	void testValidStudySetPasses() {
		String text = "Pottery in Kelaniya uses red clay, rotating wheels, firewood kilns, and decorative slip glaze.";
		SourceContent source = SourceContent.builder().id("s1").title("Pottery").text(text).build();
		PromptOptions options = PromptOptions.builder().includeQuiz(true).includeFlashcards(true).build();

		String json = """
			{
			  "courseTitle": "Kelaniya Pottery",
			  "courseDescription": "Traditional clay crafts",
			  "region": "Kelaniya",
			  "occupation": "Potter",
			  "flashcards": [
			    { "word": "red clay", "meaning": "Primary material", "evidence": "uses red clay", "sourceContentId": "s1" },
			    { "word": "rotating wheels", "meaning": "Shaping tool", "evidence": "rotating wheels", "sourceContentId": "s1" },
			    { "word": "firewood kilns", "meaning": "Baking chamber", "evidence": "firewood kilns", "sourceContentId": "s1" }
			  ],
			  "quizQuestions": [
			    {
			      "question": "What is the primary material?",
			      "optionA": "red clay",
			      "optionB": "sand",
			      "optionC": "cement",
			      "optionD": "plastic",
			      "correctOption": "A",
			      "evidence": "uses red clay",
			      "sourceContentId": "s1"
			    },
			    {
			      "question": "Which tool shapes pottery?",
			      "optionA": "rotating wheels",
			      "optionB": "knives",
			      "optionC": "hammers",
			      "optionD": "shovels",
			      "correctOption": "A",
			      "evidence": "rotating wheels",
			      "sourceContentId": "s1"
			    },
			    {
			      "question": "How are pots baked?",
			      "optionA": "firewood kilns",
			      "optionB": "sun dried only",
			      "optionC": "microwaves",
			      "optionD": "boiling water",
			      "correctOption": "A",
			      "evidence": "firewood kilns",
			      "sourceContentId": "s1"
			    }
			  ]
			}
			""";

		ValidationResult result = validator.validate(json, List.of(source), options);

		assertTrue(result.isValid());
		assertEquals(3, result.getStudySet().getFlashcards().size());
		assertEquals(3, result.getStudySet().getQuizQuestions().size());
		assertEquals(0, result.getDroppedFlashcardsCount());
		assertEquals(0, result.getDroppedQuestionsCount());
	}

	@Test
	@DisplayName("Flashcard whose word is not in the source text is dropped")
	void testFlashcardWordNotInSource() {
		String sourceText = "Traditional brass oil lamps in Pilimathalawa are cast in heavy molds.";
		SourceContent source = SourceContent.builder().id("s1").title("Brass").text(sourceText).build();
		GeneratedContentValidator singleValidator = new DefaultGeneratedContentValidator(objectMapper, 1);
		PromptOptions options = PromptOptions.builder().includeFlashcards(true).includeQuiz(false).build();

		String json = """
			{
			  "courseTitle": "Brass Lamp Craft",
			  "flashcards": [
			    { "word": "hallucinated_metal", "meaning": "Fake metal", "evidence": "heavy molds", "sourceContentId": "s1" }
			  ]
			}
			""";

		ValidationResult result = singleValidator.validate(json, List.of(source), options);

		assertFalse(result.isValid());
		assertEquals(1, result.getDroppedFlashcardsCount());
	}

	@Test
	@DisplayName("Item whose evidence quote is not in the source text is dropped")
	void testEvidenceNotInSource() {
		String sourceText = "Traditional brass oil lamps in Pilimathalawa are cast in heavy molds.";
		SourceContent source = SourceContent.builder().id("s1").title("Brass").text(sourceText).build();
		GeneratedContentValidator singleValidator = new DefaultGeneratedContentValidator(objectMapper, 1);
		PromptOptions options = PromptOptions.builder().includeFlashcards(true).includeQuiz(false).build();

		String json = """
			{
			  "courseTitle": "Brass Lamp Craft",
			  "flashcards": [
			    { "word": "brass", "meaning": "Metal alloy", "evidence": "fabricated evidence never written in story", "sourceContentId": "s1" }
			  ]
			}
			""";

		ValidationResult result = singleValidator.validate(json, List.of(source), options);

		assertFalse(result.isValid());
		assertEquals(1, result.getDroppedFlashcardsCount());
	}

	@Test
	@DisplayName("Quiz question with two correct answers (e.g. 'A,B') or invalid option letter is dropped")
	void testQuizWithTwoOrInvalidCorrectAnswers() {
		String sourceText = "Beeralu lace weavers in Galle use bobbins made of kitul wood.";
		SourceContent source = SourceContent.builder().id("s1").title("Lace").text(sourceText).build();
		GeneratedContentValidator singleValidator = new DefaultGeneratedContentValidator(objectMapper, 1);
		PromptOptions options = PromptOptions.builder().includeQuiz(true).includeFlashcards(false).build();

		String json = """
			{
			  "courseTitle": "Beeralu Lace",
			  "quizQuestions": [
			    {
			      "question": "Which materials are used?",
			      "optionA": "bobbins",
			      "optionB": "kitul wood",
			      "optionC": "stone",
			      "optionD": "clay",
			      "correctOption": "A,B",
			      "evidence": "kitul wood",
			      "sourceContentId": "s1"
			    }
			  ]
			}
			""";

		ValidationResult result = singleValidator.validate(json, List.of(source), options);

		assertFalse(result.isValid());
		assertEquals(1, result.getDroppedQuestionsCount());
	}

	@Test
	@DisplayName("Fails validation when too few valid items remain after filtering")
	void testTooFewValidItems() {
		String sourceText = "Beeralu lace weavers in Galle use bobbins made of kitul wood.";
		SourceContent source = SourceContent.builder().id("s1").title("Lace").text(sourceText).build();
		// Requires minimum 3 items
		GeneratedContentValidator multiValidator = new DefaultGeneratedContentValidator(objectMapper, 3);
		PromptOptions options = PromptOptions.builder().includeFlashcards(true).includeQuiz(false).build();

		// Only 1 grounded flashcard provided
		String json = """
			{
			  "courseTitle": "Beeralu Lace",
			  "flashcards": [
			    { "word": "bobbins", "meaning": "Weaving spools", "evidence": "use bobbins made", "sourceContentId": "s1" }
			  ]
			}
			""";

		ValidationResult result = multiValidator.validate(json, List.of(source), options);

		assertFalse(result.isValid());
		assertTrue(result.getFailureReason().contains("Fewer than 3 grounded flashcards"));
	}
}
