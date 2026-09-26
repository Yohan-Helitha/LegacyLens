package lk.ac.sliit.legacylens.moderation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Groq AI integration service using java.net.http.HttpClient (no extra dependency).
 * Calls llama-3.3-70b-versatile via the OpenAI-compatible Groq API to:
 *   1. generateQuiz()  — produce a multiple-choice heritage quiz from story content
 *   2. generateTags()  — produce culturally relevant tags from story content
 */
@Slf4j
@Service
public class GroqAiService {

    @Value("${groq.api.key:}")
    private String apiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String apiUrl;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String model;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate a multiple-choice quiz JSON from heritage story content.
     * Returns raw JSON string on success, null on failure.
     *
     * Expected response JSON shape:
     * {
     *   "question": "...",
     *   "explanation": "...",
     *   "options": [
     *     { "key": "A", "text": "...", "description": "...", "isCorrect": true  },
     *     { "key": "B", "text": "...", "description": "...", "isCorrect": false },
     *     { "key": "C", "text": "...", "description": "...", "isCorrect": false },
     *     { "key": "D", "text": "...", "description": "...", "isCorrect": false }
     *   ]
     * }
     */
    public String generateQuiz(String title, String description, String bodyContent, String type) {
        if (!isConfigured()) {
            log.warn("[GroqAiService] GROQ_API_KEY not set — skipping AI quiz generation");
            return null;
        }

        String userPrompt = buildQuizPrompt(title, description, bodyContent, type);
        String systemPrompt = "You are an expert Sri Lankan cultural heritage curator and educator. "
                + "Your task is to create an engaging, accurate multiple-choice quiz question based on the provided heritage content. "
                + "Always respond ONLY with a valid JSON object — no markdown, no explanation outside the JSON.";

        return callGroq(systemPrompt, userPrompt, 800);
    }

    /**
     * Generate culturally relevant tags from heritage story content.
     * Returns raw JSON array string on success, null on failure.
     *
     * Expected response: ["tag-one", "tag-two", "tag-three", ...]
     */
    public String generateTags(String title, String description, String bodyContent, String type) {
        if (!isConfigured()) {
            log.warn("[GroqAiService] GROQ_API_KEY not set — skipping AI tag generation");
            return null;
        }

        String userPrompt = buildTagsPrompt(title, description, bodyContent, type);
        String systemPrompt = "You are a Sri Lankan heritage archivist and digital cataloguing expert. "
                + "Your task is to generate precise, culturally meaningful taxonomy tags for heritage content. "
                + "Always respond ONLY with a valid JSON array of strings — no markdown, no explanation outside the JSON.";

        return callGroq(systemPrompt, userPrompt, 200);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROMPT BUILDERS
    // ─────────────────────────────────────────────────────────────────────────

    private String buildQuizPrompt(String title, String description, String bodyContent, String type) {
        StringBuilder sb = new StringBuilder();
        sb.append("Generate a multiple-choice knowledge quiz question based on this Sri Lankan heritage content:\n\n");
        sb.append("Title: ").append(nullSafe(title, "Heritage Story")).append("\n");
        sb.append("Content Type: ").append(nullSafe(type, "general")).append("\n");
        if (isNotBlank(description)) {
            sb.append("Description / Summary:\n").append(description.trim()).append("\n\n");
        }
        if (isNotBlank(bodyContent)) {
            // Truncate to ~2000 chars to stay within token budget
            String body = bodyContent.trim();
            if (body.length() > 2000) body = body.substring(0, 2000) + "...";
            sb.append("Full Content / Transcript:\n").append(body).append("\n\n");
        }
        sb.append("Requirements:\n");
        sb.append("- The question must test specific cultural knowledge found in the content above\n");
        sb.append("- Provide exactly 4 answer options (A, B, C, D)\n");
        sb.append("- Exactly one option must be correct (isCorrect: true)\n");
        sb.append("- Each option must have a brief educational description explaining why it is/isn't correct\n");
        sb.append("- The explanation must elaborate on the historical/cultural significance\n\n");
        sb.append("Respond ONLY with this exact JSON structure:\n");
        sb.append("{\n");
        sb.append("  \"question\": \"Your question here?\",\n");
        sb.append("  \"explanation\": \"Detailed cultural/historical explanation of the correct answer...\",\n");
        sb.append("  \"options\": [\n");
        sb.append("    { \"key\": \"A\", \"text\": \"Option A text\", \"description\": \"Why A is/isn't correct\", \"isCorrect\": true },\n");
        sb.append("    { \"key\": \"B\", \"text\": \"Option B text\", \"description\": \"Why B is/isn't correct\", \"isCorrect\": false },\n");
        sb.append("    { \"key\": \"C\", \"text\": \"Option C text\", \"description\": \"Why C is/isn't correct\", \"isCorrect\": false },\n");
        sb.append("    { \"key\": \"D\", \"text\": \"Option D text\", \"description\": \"Why D is/isn't correct\", \"isCorrect\": false }\n");
        sb.append("  ]\n");
        sb.append("}");
        return sb.toString();
    }

    private String buildTagsPrompt(String title, String description, String bodyContent, String type) {
        StringBuilder sb = new StringBuilder();
        sb.append("Generate 6 to 10 culturally relevant taxonomy tags for this Sri Lankan heritage submission:\n\n");
        sb.append("Title: ").append(nullSafe(title, "Heritage Content")).append("\n");
        sb.append("Content Type: ").append(nullSafe(type, "general")).append("\n");
        if (isNotBlank(description)) {
            sb.append("Description:\n").append(description.trim()).append("\n\n");
        }
        if (isNotBlank(bodyContent)) {
            String body = bodyContent.trim();
            if (body.length() > 1500) body = body.substring(0, 1500) + "...";
            sb.append("Content:\n").append(body).append("\n\n");
        }
        sb.append("Requirements for tags:\n");
        sb.append("- 6 to 10 tags total\n");
        sb.append("- Lowercase, hyphenated (e.g. \"kandyan-dance\", \"traditional-crafts\")\n");
        sb.append("- Mix of: craft/art type, region, material, cultural tradition, ritual, community\n");
        sb.append("- Specific to Sri Lankan heritage — not generic terms\n");
        sb.append("- No duplicates\n\n");
        sb.append("Respond ONLY with a JSON array of strings, e.g.:\n");
        sb.append("[\"kandyan-dance\", \"perahera\", \"traditional-drums\", \"central-highlands\"]");
        return sb.toString();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GROQ HTTP CALL
    // ─────────────────────────────────────────────────────────────────────────

    private String callGroq(String systemPrompt, String userPrompt, int maxTokens) {
        try {
            // Build request body
            String requestBody = objectMapper.writeValueAsString(
                    java.util.Map.of(
                            "model", model,
                            "max_tokens", maxTokens,
                            "temperature", 0.7,
                            "messages", java.util.List.of(
                                    java.util.Map.of("role", "system", "content", systemPrompt),
                                    java.util.Map.of("role", "user", "content", userPrompt)
                            ),
                            "response_format", java.util.Map.of("type", "json_object")
                    )
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("[GroqAiService] Groq API returned HTTP {}: {}", response.statusCode(), response.body());
                return null;
            }

            // Parse: response.choices[0].message.content
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode content = root.path("choices").get(0).path("message").path("content");
            if (content == null || content.isMissingNode()) {
                log.error("[GroqAiService] Unexpected Groq response shape: {}", response.body());
                return null;
            }

            String rawContent = content.asText();
            log.debug("[GroqAiService] Raw Groq response: {}", rawContent);
            return rawContent;

        } catch (Exception e) {
            log.error("[GroqAiService] Error calling Groq API: {}", e.getMessage(), e);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    private boolean isNotBlank(String s) {
        return s != null && !s.isBlank();
    }

    private String nullSafe(String s, String fallback) {
        return (s != null && !s.isBlank()) ? s : fallback;
    }
}

