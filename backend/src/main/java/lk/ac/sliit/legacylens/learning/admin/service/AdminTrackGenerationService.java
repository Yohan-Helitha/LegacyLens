package lk.ac.sliit.legacylens.learning.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.learning.admin.dto.AdminGeneratedTrackPreviewDto;
import lk.ac.sliit.legacylens.learning.admin.dto.AdminPublishTrackRequest;
import lk.ac.sliit.legacylens.learning.admin.dto.AdminTrackGenerationRequest;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AdminTrackGenerationService {

	private static final Logger log = LoggerFactory.getLogger(AdminTrackGenerationService.class);
	private static final Pattern JSON_BLOCK_PATTERN = Pattern.compile("(?s)```(?:json)?\\s*(.*?)\\s*```");

	private final AiContentGenerator aiContentGenerator;
	private final SourceContentProvider sourceContentProvider;
	private final LearningTrackRepository learningTrackRepository;
	private final LessonRepository lessonRepository;
	private final FlashcardRepository flashcardRepository;
	private final QuizQuestionRepository quizQuestionRepository;
	private final ObjectMapper objectMapper;

	public AdminTrackGenerationService(
			AiContentGenerator aiContentGenerator,
			SourceContentProvider sourceContentProvider,
			LearningTrackRepository learningTrackRepository,
			LessonRepository lessonRepository,
			FlashcardRepository flashcardRepository,
			QuizQuestionRepository quizQuestionRepository,
			ObjectMapper objectMapper) {
		this.aiContentGenerator = aiContentGenerator;
		this.sourceContentProvider = sourceContentProvider;
		this.learningTrackRepository = learningTrackRepository;
		this.lessonRepository = lessonRepository;
		this.flashcardRepository = flashcardRepository;
		this.quizQuestionRepository = quizQuestionRepository;
		this.objectMapper = objectMapper;
	}

	public AdminGeneratedTrackPreviewDto generatePreview(AdminTrackGenerationRequest request) {
		String textContent = null;
		String systemPrompt = null;
		String userPrompt = null;
		GenerationPrompt generationPrompt = null;
		GeneratedContentResult result = null;
		String jsonText = null;
		AdminGeneratedTrackPreviewDto preview = null;

		if (request == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Generation request must not be null");
		}

		if (request.getStoryId() != null && !request.getStoryId().isBlank()) {
			List<SourceContent> sources = sourceContentProvider.findApprovedByIds(List.of(request.getStoryId().trim()));
			if (sources != null && !sources.isEmpty()) {
				textContent = sources.get(0).getText();
			}
		}

		if ((textContent == null || textContent.isBlank()) && request.getSourceText() != null) {
			textContent = request.getSourceText().trim();
		}

		int targetLessons = request.getLessonCount() != null && request.getLessonCount() > 0 ? request.getLessonCount() : 2;
		int targetFlashcards = request.getFlashcardCount() != null && request.getFlashcardCount() > 0 ? request.getFlashcardCount() : 3;
		int targetQuizQuestions = request.getQuizQuestionCount() != null && request.getQuizQuestionCount() > 0 ? request.getQuizQuestionCount() : 3;
		int targetChapters = Math.max(1, targetLessons / 2);
		String regionHint = request.getRegion() != null && !request.getRegion().isBlank() ? request.getRegion() : "National Heritage";
		String occupationHint = request.getOccupation() != null && !request.getOccupation().isBlank() ? request.getOccupation() : "Traditional Craft";
		String difficultyHint = request.getDifficultyLevel() != null && !request.getDifficultyLevel().isBlank() ? request.getDifficultyLevel() : "BEGINNER";

		if (textContent == null || textContent.isBlank()) {
			textContent = String.format("Traditional Sri Lankan cultural practice of %s in %s.", occupationHint, regionHint);
		} else if (textContent.length() < 60) {
			textContent = String.format("%s. Cultural Context: Traditional heritage of %s in %s.", textContent, occupationHint, regionHint);
		}

		systemPrompt = String.format("""
				You are an expert cultural heritage curriculum developer for Sri Lankan intangible cultural heritage (LegacyLens).
				Your task is to analyze the provided source content and generate a complete, structured learning track curriculum.
				Output MUST be valid JSON conforming strictly to the required schema with no extra commentary or prose.
				JSON Schema structure:
				{
				  "title": "String (engaging heritage track title in English/Sinhala)",
				  "description": "String (concise 2-3 sentence overview)",
				  "region": "String (Sri Lankan province or district)",
				  "occupation": "String (traditional craft or practice)",
				  "difficultyLevel": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
				  "lessons": [
				    {
				      "lessonOrder": 1,
				      "title": "String (Module chapter title, e.g. 'Origins and Materials')",
				      "description": "String (Module overview)",
				      "flashcards": [
				        {
				          "word": "String (authentic dialect term, tool, or ritual word)",
				          "meaning": "String (clear definition)",
				          "culturalNote": "String (heritage context)"
				        }
				      ],
				      "quizQuestions": [
				        {
				          "question": "String (multiple choice question assessing this module)",
				          "optionA": "String",
				          "optionB": "String",
				          "optionC": "String",
				          "optionD": "String",
				          "correctOption": "A" | "B" | "C" | "D"
				        }
				      ]
				    }
				  ]
				}
				Rules:
				1. Base all facts, terms, and quiz questions strictly on the provided source content.
				2. Each module in 'lessons' MUST contain BOTH flashcards AND quiz questions. You MUST generate both!
				3. For each module: provide exactly %d flashcards and exactly %d multiple-choice quiz questions.
				4. Provide 4 distinct options for every quiz question and set correctOption to exactly 'A', 'B', 'C', or 'D'.
				""", targetFlashcards, targetQuizQuestions);

		userPrompt = String.format("""
				Target Requirements:
				- Number of curriculum modules to generate: %d
				- Flashcards required per module: %d (authentic vocabulary, tools, dialect words)
				- Quiz questions required per module: %d (grounded multiple choice questions with A,B,C,D options)
				- Region hint: %s
				- Occupation / Craft hint: %s
				- Difficulty level: %s

				=== SOURCE CONTENT START ===
				%s
				=== SOURCE CONTENT END ===
				""", targetChapters, targetFlashcards, targetQuizQuestions, regionHint, occupationHint, difficultyHint, textContent);

		generationPrompt = GenerationPrompt.builder()
				.systemInstruction(systemPrompt)
				.userPayload(userPrompt)
				.expectedSchemaName("AdminGeneratedTrackPreviewDto")
				.maxOutputTokens(2500)
				.timeoutSeconds(45)
				.build();

		try {
			result = aiContentGenerator.generate(generationPrompt);
		} catch (Exception ex) {
			log.error("AI Generation failed for admin track: {}", ex.getMessage());
			throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "AI generator failed to respond in time: " + ex.getMessage());
		}

		if (result == null || result.getRawJson() == null || result.getRawJson().isBlank()) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "AI generator returned an empty response");
		}

		jsonText = cleanJson(result.getRawJson());

		try {
			preview = objectMapper.readValue(jsonText, AdminGeneratedTrackPreviewDto.class);
		} catch (Exception ex) {
			log.error("Failed to parse AI output into AdminGeneratedTrackPreviewDto: {}", ex.getMessage());
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
					"Failed to parse AI generated curriculum into valid structure: " + ex.getMessage());
		}

		if (preview.getDifficultyLevel() == null || preview.getDifficultyLevel().isBlank()) {
			preview.setDifficultyLevel(difficultyHint);
		}
		if (preview.getRegion() == null || preview.getRegion().isBlank()) {
			preview.setRegion(regionHint.equals("Not specified") ? "National Heritage" : regionHint);
		}
		if (preview.getOccupation() == null || preview.getOccupation().isBlank()) {
			preview.setOccupation(occupationHint.equals("Not specified") ? "Traditional Craft" : occupationHint);
		}

		// Normalize lessons so every module produces paired FLASHCARDS and QUIZ lessons
		normalizePreviewLessons(preview, targetQuizQuestions);

		log.info("Successfully generated admin track preview: '{}' with {} lessons (latency: {} ms)",
				preview.getTitle(), preview.getLessons() != null ? preview.getLessons().size() : 0, result.getLatencyMs());

		return preview;
	}

	public void normalizePreviewLessons(AdminGeneratedTrackPreviewDto preview) {
		normalizePreviewLessons(preview, 3);
	}

	public void normalizePreviewLessons(AdminGeneratedTrackPreviewDto preview, int targetQuizQuestions) {
		if (preview == null || preview.getLessons() == null || preview.getLessons().isEmpty()) {
			return;
		}

		List<AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto> normalized = new ArrayList<>();
		int order = 1;

		for (AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto lDto : preview.getLessons()) {
			boolean isAlreadyFlashcards = "FLASHCARDS".equalsIgnoreCase(lDto.getType());
			boolean isAlreadyQuiz = "QUIZ".equalsIgnoreCase(lDto.getType());

			boolean hasFlashcards = lDto.getFlashcards() != null && !lDto.getFlashcards().isEmpty();
			boolean hasQuizzes = lDto.getQuizQuestions() != null && !lDto.getQuizQuestions().isEmpty();

			// If already normalized pure FLASHCARDS lesson, preserve as-is
			if (isAlreadyFlashcards && !hasQuizzes) {
				lDto.setLessonOrder(order++);
				if (lDto.getQuizQuestions() == null) {
					lDto.setQuizQuestions(new ArrayList<>());
				}
				normalized.add(lDto);
				continue;
			}

			// If already normalized pure QUIZ lesson, preserve as-is
			if (isAlreadyQuiz && !hasFlashcards) {
				lDto.setLessonOrder(order++);
				if (lDto.getFlashcards() == null) {
					lDto.setFlashcards(new ArrayList<>());
				}
				normalized.add(lDto);
				continue;
			}

			// Fallback guarantee for raw AI modules: if AI did not return quiz questions, synthesize them from flashcards
			if (hasFlashcards && !hasQuizzes) {
				lDto.setQuizQuestions(generateFallbackQuizzes(lDto.getFlashcards(), targetQuizQuestions));
				hasQuizzes = true;
			}

			if (hasFlashcards && hasQuizzes) {
				// 1. Dedicated FLASHCARDS lesson
				String baseTitle = lDto.getTitle() != null ? lDto.getTitle() : "Module " + order;
				String fcTitle = baseTitle;
				if (!fcTitle.toLowerCase().contains("flashcard") && !fcTitle.toLowerCase().contains("vocabulary")) {
					fcTitle += " - Vocabulary & Flashcards";
				}
				AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto fcLesson =
						AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto.builder()
								.lessonOrder(order++)
								.title(fcTitle)
								.description(lDto.getDescription() != null ? lDto.getDescription() : "Key vocabulary and heritage terms.")
								.type("FLASHCARDS")
								.flashcards(new ArrayList<>(lDto.getFlashcards()))
								.quizQuestions(new ArrayList<>())
								.build();
				normalized.add(fcLesson);

				// 2. Dedicated QUIZ lesson
				String quizTitle = baseTitle;
				if (!quizTitle.toLowerCase().contains("quiz") && !quizTitle.toLowerCase().contains("test")) {
					quizTitle += " - Knowledge Quiz";
				}
				AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto quizLesson =
						AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto.builder()
								.lessonOrder(order++)
								.title(quizTitle)
								.description("Comprehension test on " + baseTitle)
								.type("QUIZ")
								.flashcards(new ArrayList<>())
								.quizQuestions(new ArrayList<>(lDto.getQuizQuestions()))
								.build();
				normalized.add(quizLesson);
			} else if (hasQuizzes) {
				lDto.setLessonOrder(order++);
				lDto.setType("QUIZ");
				if (lDto.getFlashcards() == null) {
					lDto.setFlashcards(new ArrayList<>());
				}
				normalized.add(lDto);
			} else {
				lDto.setLessonOrder(order++);
				lDto.setType("FLASHCARDS");
				if (lDto.getQuizQuestions() == null) {
					lDto.setQuizQuestions(new ArrayList<>());
				}
				normalized.add(lDto);
			}
		}

		preview.setLessons(normalized);
	}

	private List<AdminGeneratedTrackPreviewDto.AdminGeneratedQuizDto> generateFallbackQuizzes(
			List<AdminGeneratedTrackPreviewDto.AdminGeneratedFlashcardDto> flashcards,
			int count) {
		List<AdminGeneratedTrackPreviewDto.AdminGeneratedQuizDto> list = new ArrayList<>();
		if (flashcards == null || flashcards.isEmpty()) {
			return list;
		}

		int needed = Math.max(1, count);
		for (int i = 0; i < flashcards.size() && list.size() < needed; i++) {
			AdminGeneratedTrackPreviewDto.AdminGeneratedFlashcardDto fc = flashcards.get(i);
			if (fc.getWord() == null || fc.getWord().isBlank()) continue;

			String correctMeaning = fc.getMeaning() != null && !fc.getMeaning().isBlank() ? fc.getMeaning() : "Traditional cultural practice";
			String distractor1 = "A modern synthetic manufacturing method";
			String distractor2 = "An imported ritual dance custom";
			String distractor3 = "A temporary agricultural storage unit";

			AdminGeneratedTrackPreviewDto.AdminGeneratedQuizDto q = AdminGeneratedTrackPreviewDto.AdminGeneratedQuizDto.builder()
					.question(String.format("What is the meaning or role of '%s' in this traditional craft?", fc.getWord()))
					.optionA(correctMeaning)
					.optionB(distractor1)
					.optionC(distractor2)
					.optionD(distractor3)
					.correctOption("A")
					.build();
			list.add(q);
		}

		return list;
	}

	@Transactional
	public LearningTrack publishTrack(AdminPublishTrackRequest request) {
		AdminGeneratedTrackPreviewDto preview = null;
		LearningTrack track = null;
		LearningTrack savedTrack = null;
		int lessonOrderCounter = 1;

		if (request == null || request.getPreview() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Track preview must not be null");
		}

		preview = request.getPreview();

		if (preview.getTitle() == null || preview.getTitle().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Track title is required");
		}

		// Ensure all lessons are clean FLASHCARDS or QUIZ entities
		normalizePreviewLessons(preview);

		track = new LearningTrack();
		track.setOrigin("ADMIN");
		track.setVisibility("PUBLIC");
		track.setOwnerUserId(null);
		track.setTitle(preview.getTitle().trim());
		track.setDescription(preview.getDescription());
		track.setRegion(preview.getRegion());
		track.setOccupation(preview.getOccupation());
		track.setDifficultyLevel(preview.getDifficultyLevel() != null ? preview.getDifficultyLevel() : "BEGINNER");
		track.setThumbnailUrl(preview.getThumbnailUrl());
		track.setTotalLessons(preview.getLessons() != null ? preview.getLessons().size() : 0);

		savedTrack = learningTrackRepository.save(track);

		if (preview.getLessons() != null) {
			for (AdminGeneratedTrackPreviewDto.AdminGeneratedLessonDto lDto : preview.getLessons()) {
				Lesson lesson = new Lesson();
				lesson.setTrack(savedTrack);
				lesson.setLessonOrder(lessonOrderCounter++);
				lesson.setTitle(lDto.getTitle() != null ? lDto.getTitle() : "Lesson " + lesson.getLessonOrder());
				lesson.setDescription(lDto.getDescription());
				String type = "QUIZ".equalsIgnoreCase(lDto.getType()) ? "QUIZ" : "FLASHCARDS";
				lesson.setType(type);

				Lesson savedLesson = lessonRepository.save(lesson);

				if ("FLASHCARDS".equals(type) && lDto.getFlashcards() != null) {
					for (AdminGeneratedTrackPreviewDto.AdminGeneratedFlashcardDto fcDto : lDto.getFlashcards()) {
						if (fcDto.getWord() != null && !fcDto.getWord().isBlank()) {
							Flashcard fc = new Flashcard();
							fc.setLesson(savedLesson);
							fc.setWord(fcDto.getWord().trim());
							fc.setMeaning(fcDto.getMeaning());
							fc.setCulturalNote(fcDto.getCulturalNote());
							if (fcDto.getAudioUrl() != null && !fcDto.getAudioUrl().isBlank()) {
								fc.setAudioUrl(fcDto.getAudioUrl().trim());
							}
							flashcardRepository.save(fc);
						}
					}
				}

				if ("QUIZ".equals(type) && lDto.getQuizQuestions() != null) {
					for (AdminGeneratedTrackPreviewDto.AdminGeneratedQuizDto qDto : lDto.getQuizQuestions()) {
						if (qDto.getQuestion() != null && !qDto.getQuestion().isBlank()) {
							QuizQuestion q = new QuizQuestion();
							q.setLesson(savedLesson);
							q.setQuestion(qDto.getQuestion().trim());
							q.setOptionA(qDto.getOptionA() != null ? qDto.getOptionA() : "Option A");
							q.setOptionB(qDto.getOptionB() != null ? qDto.getOptionB() : "Option B");
							q.setOptionC(qDto.getOptionC() != null ? qDto.getOptionC() : "Option C");
							q.setOptionD(qDto.getOptionD() != null ? qDto.getOptionD() : "Option D");
							q.setCorrectOption(qDto.getCorrectOption() != null ? qDto.getCorrectOption().toUpperCase() : "A");
							quizQuestionRepository.save(q);
						}
					}
				}
			}
		}

		savedTrack.setTotalLessons(lessonOrderCounter - 1);
		savedTrack = learningTrackRepository.save(savedTrack);

		log.info("Published admin AI generated track ID: {} ('{}') with {} lessons",
				savedTrack.getId(), savedTrack.getTitle(), savedTrack.getTotalLessons());

		return savedTrack;
	}

	@EventListener(ApplicationReadyEvent.class)
	@Transactional
	public void repairLegacyCultureLessons() {
		try {
			List<Lesson> allLessons = lessonRepository.findAll();
			boolean changesMade = false;
			for (Lesson lesson : allLessons) {
				if ("CULTURE".equalsIgnoreCase(lesson.getType()) || lesson.getType() == null) {
					List<Flashcard> fcs = flashcardRepository.findByLessonIdOrderByIdAsc(lesson.getId());
					List<QuizQuestion> qqs = quizQuestionRepository.findByLessonIdOrderByIdAsc(lesson.getId());

					if (!fcs.isEmpty() && !qqs.isEmpty()) {
						lesson.setType("FLASHCARDS");
						if (!lesson.getTitle().toLowerCase().contains("flashcard") && !lesson.getTitle().toLowerCase().contains("vocabulary")) {
							lesson.setTitle(lesson.getTitle() + " - Flashcards");
						}
						lessonRepository.save(lesson);

						Lesson quizLesson = new Lesson();
						quizLesson.setTrack(lesson.getTrack());
						quizLesson.setLessonOrder(lesson.getLessonOrder() + 1);
						quizLesson.setTitle(lesson.getTitle().replace(" - Flashcards", "") + " - Quiz");
						quizLesson.setDescription("Practice quiz questions on " + lesson.getTitle().replace(" - Flashcards", ""));
						quizLesson.setType("QUIZ");
						Lesson savedQuizLesson = lessonRepository.save(quizLesson);

						for (QuizQuestion q : qqs) {
							q.setLesson(savedQuizLesson);
							quizQuestionRepository.save(q);
						}
						changesMade = true;
					} else if (!qqs.isEmpty()) {
						lesson.setType("QUIZ");
						lessonRepository.save(lesson);
						changesMade = true;
					} else {
						lesson.setType("FLASHCARDS");
						lessonRepository.save(lesson);
						changesMade = true;
					}
				}
			}

			if (changesMade) {
				List<LearningTrack> tracks = learningTrackRepository.findAll();
				for (LearningTrack t : tracks) {
					List<Lesson> trackLessons = lessonRepository.findByTrackIdOrderByLessonOrderAsc(t.getId());
					int order = 1;
					for (Lesson l : trackLessons) {
						l.setLessonOrder(order++);
						lessonRepository.save(l);
					}
					t.setTotalLessons(trackLessons.size());
					learningTrackRepository.save(t);
				}
				log.info("Auto-repaired legacy CULTURE lessons across tracks to pure FLASHCARDS/QUIZ.");
			}
		} catch (Exception e) {
			log.warn("Repair of legacy culture lessons skipped or note: {}", e.getMessage());
		}
	}

	private String cleanJson(String raw) {
		if (raw == null) {
			return "";
		}

		Matcher matcher = JSON_BLOCK_PATTERN.matcher(raw);
		if (matcher.find()) {
			return matcher.group(1).trim();
		}

		return raw.trim();
	}
}
