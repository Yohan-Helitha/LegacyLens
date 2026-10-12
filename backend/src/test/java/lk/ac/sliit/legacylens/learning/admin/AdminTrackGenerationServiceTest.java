package lk.ac.sliit.legacylens.learning.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.learning.admin.dto.AdminGeneratedTrackPreviewDto;
import lk.ac.sliit.legacylens.learning.admin.dto.AdminPublishTrackRequest;
import lk.ac.sliit.legacylens.learning.admin.dto.AdminTrackGenerationRequest;
import lk.ac.sliit.legacylens.learning.admin.service.AdminTrackGenerationService;
import lk.ac.sliit.legacylens.learning.ai.provider.AiContentGenerator;
import lk.ac.sliit.legacylens.learning.ai.provider.GeneratedContentResult;
import lk.ac.sliit.legacylens.learning.ai.provider.GenerationPrompt;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContent;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContentProvider;
import lk.ac.sliit.legacylens.learning.entity.Flashcard;
import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.entity.QuizQuestion;
import lk.ac.sliit.legacylens.learning.repository.FlashcardRepository;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonRepository;
import lk.ac.sliit.legacylens.learning.repository.QuizQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminTrackGenerationServiceTest {

	private AiContentGenerator aiContentGenerator;
	private SourceContentProvider sourceContentProvider;
	private LearningTrackRepository learningTrackRepository;
	private LessonRepository lessonRepository;
	private FlashcardRepository flashcardRepository;
	private QuizQuestionRepository quizQuestionRepository;
	private ObjectMapper objectMapper;
	private AdminTrackGenerationService service;

	@BeforeEach
	void setUp() {
		aiContentGenerator = mock(AiContentGenerator.class);
		sourceContentProvider = mock(SourceContentProvider.class);
		learningTrackRepository = mock(LearningTrackRepository.class);
		lessonRepository = mock(LessonRepository.class);
		flashcardRepository = mock(FlashcardRepository.class);
		quizQuestionRepository = mock(QuizQuestionRepository.class);
		objectMapper = new ObjectMapper();

		service = new AdminTrackGenerationService(
				aiContentGenerator,
				sourceContentProvider,
				learningTrackRepository,
				lessonRepository,
				flashcardRepository,
				quizQuestionRepository,
				objectMapper
		);
	}

	@Test
	void generatePreview_ThrowsBadRequest_WhenRequestNull() {
		assertThrows(ResponseStatusException.class, () -> service.generatePreview(null));
	}

	@Test
	void generatePreview_Succeeds_WhenValidContentProvided() {
		String validJson = """
				{
				  "title": "Traditional Mask Making of Ambalangoda",
				  "description": "Learn the ancient Kolam and Sanni mask carving heritage.",
				  "region": "Southern Province",
				  "occupation": "Wood Carving",
				  "difficultyLevel": "BEGINNER",
				  "lessons": [
				    {
				      "lessonOrder": 1,
				      "title": "Kaduru Wood Preparation",
				      "description": "How soft kaduru timber is seasoned.",
				      "type": "CULTURE",
				      "flashcards": [
				        {
				          "word": "වෙස් මුහුණු (Ves Muhunu)",
				          "meaning": "Traditional carved wooden dance masks",
				          "culturalNote": "Used in healing rituals."
				        }
				      ],
				      "quizQuestions": [
				        {
				          "question": "Which wood is traditionally used for Ambalangoda masks?",
				          "optionA": "Kaduru wood",
				          "optionB": "Teak",
				          "optionC": "Ebony",
				          "optionD": "Mahogany",
				          "correctOption": "A"
				        }
				      ]
				    }
				  ]
				}
				""";

		GeneratedContentResult aiResult = GeneratedContentResult.builder()
				.rawJson(validJson)
				.latencyMs(120L)
				.inputTokens(200)
				.outputTokens(350)
				.modelName("llama-3.3-70b-versatile")
				.build();

		when(aiContentGenerator.generate(any(GenerationPrompt.class))).thenReturn(aiResult);

		AdminTrackGenerationRequest request = AdminTrackGenerationRequest.builder()
				.sourceText("This is an extensive traditional folklore documentation regarding Ambalangoda wood carving traditions and rituals.")
				.region("Southern Province")
				.occupation("Wood Carving")
				.build();

		AdminGeneratedTrackPreviewDto preview = service.generatePreview(request);

		assertNotNull(preview);
		assertEquals("Traditional Mask Making of Ambalangoda", preview.getTitle());
		assertEquals(2, preview.getLessons().size());
		assertEquals("FLASHCARDS", preview.getLessons().get(0).getType());
		assertEquals(1, preview.getLessons().get(0).getFlashcards().size());
		assertEquals("වෙස් මුහුණු (Ves Muhunu)", preview.getLessons().get(0).getFlashcards().get(0).getWord());
		assertEquals("QUIZ", preview.getLessons().get(1).getType());
		assertEquals(1, preview.getLessons().get(1).getQuizQuestions().size());
		assertEquals("A", preview.getLessons().get(1).getQuizQuestions().get(0).getCorrectOption());
	}

	@Test
	void publishTrack_SavesTrackAndLessons() {
		AdminGeneratedTrackPreviewDto.AdminGeneratedFlashcardDto fcDto =
				AdminGeneratedTrackPreviewDto.AdminGeneratedFlashcardDto.builder()
						.word("බීරලු")
						.meaning("Lace bobbins")
						.culturalNote("Traditional Southern craft")
						.build();

		AdminGeneratedTrackPreviewDto.AdminGeneratedQuizDto qDto =
				AdminGeneratedTrackPreviewDto.AdminGeneratedQuizDto.builder()
						.question("Where is Beeralu lace traditionally made?")
						.optionA("Galle")
						.optionB("Kandy")
						.optionC("Jaffna")
						.optionD("Badulla")
						.correctOption("A")
						.build();

		AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto lDto =
				AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto.builder()
						.lessonOrder(1)
						.title("Lace Origins")
						.description("History of lace")
						.type("CULTURE")
						.flashcards(List.of(fcDto))
						.quizQuestions(List.of(qDto))
						.build();

		AdminGeneratedTrackPreviewDto preview = AdminGeneratedTrackPreviewDto.builder()
				.title("Southern Beeralu Lace")
				.description("Heritage lace crafting")
				.region("Southern")
				.occupation("Lace Making")
				.difficultyLevel("BEGINNER")
				.lessons(List.of(lDto))
				.build();

		AdminPublishTrackRequest request = AdminPublishTrackRequest.builder()
				.preview(preview)
				.build();

		when(learningTrackRepository.save(any(LearningTrack.class))).thenAnswer(invocation -> {
			LearningTrack t = invocation.getArgument(0);
			t.setId(101L);
			return t;
		});

		when(lessonRepository.save(any(Lesson.class))).thenAnswer(invocation -> {
			Lesson l = invocation.getArgument(0);
			l.setId(202L);
			return l;
		});

		LearningTrack published = service.publishTrack(request);

		assertNotNull(published);
		assertEquals(101L, published.getId());
		assertEquals("ADMIN", published.getOrigin());
		assertEquals("PUBLIC", published.getVisibility());
		assertEquals(2, published.getTotalLessons());
		verify(learningTrackRepository, atLeastOnce()).save(any(LearningTrack.class));
		verify(lessonRepository, times(2)).save(any(Lesson.class));
		verify(flashcardRepository).save(any(Flashcard.class));
		verify(quizQuestionRepository).save(any(QuizQuestion.class));
	}

	@Test
	void normalizePreviewLessons_GeneratesFallbackQuizzes_WhenQuizQuestionsMissing() {
		AdminGeneratedTrackPreviewDto.AdminGeneratedFlashcardDto fcDto1 =
				AdminGeneratedTrackPreviewDto.AdminGeneratedFlashcardDto.builder()
						.word("කළගෙඩි")
						.meaning("Clay water pots")
						.culturalNote("Used in traditional folk dances")
						.build();
		AdminGeneratedTrackPreviewDto.AdminGeneratedFlashcardDto fcDto2 =
				AdminGeneratedTrackPreviewDto.AdminGeneratedFlashcardDto.builder()
						.word("සවරම")
						.meaning("Traditional hair ornament")
						.culturalNote("Worn by dancers")
						.build();

		AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto lDto =
				AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto.builder()
						.lessonOrder(1)
						.title("Pottery Dance")
						.description("Traditional dance props")
						.flashcards(List.of(fcDto1, fcDto2))
						.quizQuestions(List.of())
						.build();

		AdminGeneratedTrackPreviewDto preview = AdminGeneratedTrackPreviewDto.builder()
				.title("Pottery Dance Track")
				.lessons(List.of(lDto))
				.build();

		service.normalizePreviewLessons(preview, 3);

		// Must produce 2 lessons: 1 FLASHCARDS and 1 QUIZ
		assertEquals(2, preview.getLessons().size());
		AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto fcLesson = preview.getLessons().get(0);
		AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto quizLesson = preview.getLessons().get(1);

		assertEquals("FLASHCARDS", fcLesson.getType());
		assertEquals(2, fcLesson.getFlashcards().size());
		assertTrue(fcLesson.getQuizQuestions().isEmpty());

		assertEquals("QUIZ", quizLesson.getType());
		assertEquals(2, quizLesson.getQuizQuestions().size());
		assertTrue(quizLesson.getFlashcards().isEmpty());
		assertNotNull(quizLesson.getQuizQuestions().get(0).getQuestion());
		assertNotNull(quizLesson.getQuizQuestions().get(0).getCorrectOption());

		// Test Idempotence: Calling normalizePreviewLessons a second time should keep exactly 2 lessons
		service.normalizePreviewLessons(preview, 3);
		assertEquals(2, preview.getLessons().size());
		assertEquals("FLASHCARDS", preview.getLessons().get(0).getType());
		assertEquals("QUIZ", preview.getLessons().get(1).getType());
	}
}
