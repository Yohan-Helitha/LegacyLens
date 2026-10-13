package lk.ac.sliit.legacylens.learning.ai.prompt;

import lk.ac.sliit.legacylens.learning.ai.provider.GenerationPrompt;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class StudySetPromptBuilder implements PromptBuilder {

	public static final int PROMPT_VERSION = 1;

	private final int maxSourceChars;
	private final int maxOutputTokens;
	private final int timeoutSeconds;

	public StudySetPromptBuilder(
			@Value("${app.learning.builder.max-source-chars:12000}") int maxSourceChars,
			@Value("${app.ai.max-output-tokens:2500}") int maxOutputTokens,
			@Value("${app.ai.timeout-seconds:45}") int timeoutSeconds) {
		this.maxSourceChars = maxSourceChars > 0 ? maxSourceChars : 12000;
		this.maxOutputTokens = maxOutputTokens > 0 ? maxOutputTokens : 2500;
		this.timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 45;
	}

	@Override
	public GenerationPrompt buildPrompt(List<SourceContent> contents, PromptOptions options) {
		String systemInstruction = buildSystemInstruction();
		String userPayload = buildUserPayload(contents, options);
		GenerationPrompt prompt = null;

		prompt = GenerationPrompt.builder()
				.systemInstruction(systemInstruction)
				.userPayload(userPayload)
				.expectedSchemaName("StudySetSchema")
				.maxOutputTokens(maxOutputTokens)
				.timeoutSeconds(timeoutSeconds)
				.build();

		return prompt;
	}

	private String buildSystemInstruction() {
		return """
			You are an expert Sri Lankan cultural heritage educator.
			Your task is to create high-quality learning materials (flashcards, quiz questions, and micro-courses) based on community-captured stories.
			
			CRITICAL RULES:
			1. GROUNDING REQUIREMENT: You MUST ONLY use vocabulary words, meanings, traditions, and facts that are explicitly written in the provided source texts.
			2. DO NOT hallucinate, invent dialect terms, or extrapolate cultural details not stated in the source.
			3. For every flashcard and quiz question, you MUST provide:
			   - sourceContentId: The exact ID of the source text where this information came from.
			   - evidence: A short, exact snippet or quote copied directly from that source text supporting the term or answer.
			4. Flashcard "word" must be the exact dialect or vocabulary word found in the source text.
			5. Every quiz question must have 4 distinct options (optionA, optionB, optionC, optionD) and exactly 1 correctOption ('A', 'B', 'C', or 'D').
			6. Output MUST be valid JSON and nothing else. No markdown wrappers or preamble.
			""";
	}

	private String buildUserPayload(List<SourceContent> contents, PromptOptions options) {
		StringBuilder sb = new StringBuilder();
		int totalChars = 0;
		int qCount = options.isIncludeQuiz() ? (options.getQuizQuestionCount() > 0 ? options.getQuizQuestionCount() : 5) : 0;
		int fcCount = options.isIncludeFlashcards() ? (options.getFlashcardCount() > 0 ? options.getFlashcardCount() : 5) : 0;
		int lessonCount = options.isIncludeMiniCourse() ? (options.getCourseLessonCount() > 0 ? options.getCourseLessonCount() : 2) : 2;

		sb.append("Please generate learning materials with the following specifications:\n");
		sb.append("- Include Quiz: ").append(options.isIncludeQuiz()).append(" (target questions: ").append(qCount).append(")\n");
		sb.append("- Include Flashcards: ").append(options.isIncludeFlashcards()).append(" (target cards: ").append(fcCount).append(")\n");
		sb.append("- Include Mini Course: ").append(options.isIncludeMiniCourse()).append(" (target lessons: ").append(lessonCount).append(")\n\n");

		sb.append("Output JSON Schema:\n");
		sb.append("""
			{
			  "courseTitle": "Title of the study track",
			  "courseDescription": "Brief description",
			  "region": "Primary region from sources",
			  "occupation": "Primary occupation or cultural topic",
			  "lessons": [
			    { "title": "Lesson title", "description": "Lesson summary", "type": "FLASHCARDS" },
			    { "title": "Lesson title", "description": "Lesson summary", "type": "QUIZ" }
			  ],
			  "flashcards": [
			    {
			      "word": "Exact term from source",
			      "meaning": "Meaning explained in source",
			      "culturalNote": "Cultural context from source",
			      "sourceContentId": "source ID",
			      "evidence": "Exact quote from source"
			    }
			  ],
			  "quizQuestions": [
			    {
			      "question": "Question text based strictly on source",
			      "optionA": "Option text",
			      "optionB": "Option text",
			      "optionC": "Option text",
			      "optionD": "Option text",
			      "correctOption": "A",
			      "flashcardWord": "Word from flashcards if related, else null",
			      "sourceContentId": "source ID",
			      "evidence": "Exact quote from source"
			    }
			  ]
			}
			""");

		sb.append("\n<source_data>\n");
		for (SourceContent content : contents) {
			String text = content.getText() != null ? content.getText() : "";
			totalChars += text.length();
			if (totalChars > maxSourceChars) {
				throw new IllegalArgumentException("Selected source contents exceed maximum character limit of " + maxSourceChars);
			}

			sb.append("[SOURCE_ITEM id=\"").append(content.getId()).append("\" title=\"").append(content.getTitle()).append("\"]\n");
			sb.append(text).append("\n\n");
		}
		sb.append("</source_data>\n");

		return sb.toString();
	}
}
