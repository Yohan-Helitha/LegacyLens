package lk.ac.sliit.legacylens.learning.ai.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "gemini", matchIfMissing = true)
public class GeminiAiContentGenerator implements AiContentGenerator {

	private static final Logger log = LoggerFactory.getLogger(GeminiAiContentGenerator.class);
	private static final String GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

	private final String apiKey;
	private final String modelName;
	private final int defaultTimeoutSeconds;
	private final RestClient restClient;
	private final ObjectMapper objectMapper;

	public GeminiAiContentGenerator(
			@Value("${app.ai.api-key:}") String apiKey,
			@Value("${app.ai.model:gemini-1.5-flash}") String modelName,
			@Value("${app.ai.timeout-seconds:45}") int defaultTimeoutSeconds,
			ObjectMapper objectMapper) {
		this.apiKey = apiKey != null ? apiKey.trim() : "";
		this.modelName = modelName != null && !modelName.isBlank() ? modelName.trim() : "gemini-1.5-flash";
		this.defaultTimeoutSeconds = defaultTimeoutSeconds > 0 ? defaultTimeoutSeconds : 45;
		this.objectMapper = objectMapper;

		SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setConnectTimeout(Duration.ofSeconds(10));
		requestFactory.setReadTimeout(Duration.ofSeconds(this.defaultTimeoutSeconds));

		this.restClient = RestClient.builder()
				.requestFactory(requestFactory)
				.build();
	}

	@Override
	public String getProviderName() {
		return "gemini";
	}

	@Override
	public GeneratedContentResult generate(GenerationPrompt prompt) {
		long startTime = System.currentTimeMillis();
		int maxTokens = prompt.getMaxOutputTokens() != null ? prompt.getMaxOutputTokens() : 2500;
		String url = GEMINI_API_BASE_URL + "/" + modelName + ":generateContent?key=" + apiKey;
		Map<String, Object> requestPayload = buildGeminiRequestBody(prompt, maxTokens);
		String responseBody = null;
		GeneratedContentResult result = null;

		if (apiKey.isBlank()) {
			throw new IllegalStateException("Google Gemini API key is missing. Please configure AI_API_KEY.");
		}

		try {
			responseBody = restClient.post()
					.uri(url)
					.contentType(MediaType.APPLICATION_JSON)
					.body(requestPayload)
					.retrieve()
					.body(String.class);

			result = parseGeminiResponse(responseBody, startTime);
		} catch (Exception ex) {
			long elapsed = System.currentTimeMillis() - startTime;
			log.error("Gemini AI generation failed after {} ms: {}", elapsed, ex.getMessage());
			throw new RuntimeException("AI content generation failed: " + ex.getMessage(), ex);
		}

		return result;
	}

	private Map<String, Object> buildGeminiRequestBody(GenerationPrompt prompt, int maxTokens) {
		Map<String, Object> body = new HashMap<>();
		Map<String, Object> generationConfig = new HashMap<>();

		if (prompt.getSystemInstruction() != null && !prompt.getSystemInstruction().isBlank()) {
			Map<String, Object> systemPart = Map.of("text", prompt.getSystemInstruction());
			body.put("systemInstruction", Map.of("parts", List.of(systemPart)));
		}

		Map<String, Object> userPart = Map.of("text", prompt.getUserPayload() != null ? prompt.getUserPayload() : "");
		body.put("contents", List.of(Map.of("role", "user", "parts", List.of(userPart))));

		generationConfig.put("responseMimeType", "application/json");
		generationConfig.put("maxOutputTokens", maxTokens);
		generationConfig.put("temperature", 0.2);
		body.put("generationConfig", generationConfig);

		return body;
	}

	private GeneratedContentResult parseGeminiResponse(String responseBody, long startTime) {
		long latencyMs = System.currentTimeMillis() - startTime;
		String rawJson = "{}";
		Integer inputTokens = null;
		Integer outputTokens = null;
		GeneratedContentResult result = null;

		try {
			JsonNode root = objectMapper.readTree(responseBody);
			JsonNode candidates = root.path("candidates");

			if (candidates.isArray() && !candidates.isEmpty()) {
				JsonNode firstCandidate = candidates.get(0);
				JsonNode parts = firstCandidate.path("content").path("parts");
				if (parts.isArray() && !parts.isEmpty()) {
					rawJson = parts.get(0).path("text").asText();
				}
			}

			JsonNode usage = root.path("usageMetadata");
			if (!usage.isMissingNode()) {
				inputTokens = usage.path("promptTokenCount").asInt();
				outputTokens = usage.path("candidatesTokenCount").asInt();
			}

			log.info("Gemini generation succeeded (model={}, latencyMs={}, inTokens={}, outTokens={})",
					modelName, latencyMs, inputTokens, outputTokens);
		} catch (Exception parseEx) {
			log.error("Failed to parse Gemini API JSON response: {}", parseEx.getMessage());
			throw new RuntimeException("Failed to parse Gemini output", parseEx);
		}

		result = GeneratedContentResult.builder()
				.rawJson(rawJson)
				.inputTokens(inputTokens)
				.outputTokens(outputTokens)
				.latencyMs(latencyMs)
				.modelName(modelName)
				.build();

		return result;
	}
}
