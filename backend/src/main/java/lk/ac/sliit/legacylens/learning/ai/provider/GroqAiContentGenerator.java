package lk.ac.sliit.legacylens.learning.ai.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "groq")
public class GroqAiContentGenerator implements AiContentGenerator {

	private static final Logger log = LoggerFactory.getLogger(GroqAiContentGenerator.class);
	public static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
	public static final String DEFAULT_MODEL = "llama-3.3-70b-versatile";
	public static final String FALLBACK_MODEL = "openai/gpt-oss-120b";

	private final String apiKey;
	private final String modelName;
	private final int defaultTimeoutSeconds;
	private final RestClient restClient;
	private final ObjectMapper objectMapper;

	@Autowired
	public GroqAiContentGenerator(
			@Value("${learning.ai.groq.api-key:${app.ai.api-key:}}") String apiKey,
			@Value("${learning.ai.groq.model:llama-3.3-70b-versatile}") String modelName,
			@Value("${learning.ai.groq.timeout-seconds:45}") int defaultTimeoutSeconds,
			ObjectMapper objectMapper) {
		this.apiKey = apiKey != null ? apiKey.trim() : "";
		this.modelName = modelName != null && !modelName.isBlank() ? modelName.trim() : DEFAULT_MODEL;
		this.defaultTimeoutSeconds = defaultTimeoutSeconds > 0 ? defaultTimeoutSeconds : 45;
		this.objectMapper = objectMapper;

		SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setConnectTimeout(Duration.ofSeconds(10));
		requestFactory.setReadTimeout(Duration.ofSeconds(this.defaultTimeoutSeconds));

		RestClient.Builder clientBuilder = RestClient.builder()
				.baseUrl(GROQ_API_URL)
				.requestFactory(requestFactory);

		if (!this.apiKey.isBlank()) {
			clientBuilder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + this.apiKey);
		}

		this.restClient = clientBuilder.build();
	}

	// Package-private constructor for unit testing with custom/mock RestClient
	GroqAiContentGenerator(
			String apiKey,
			String modelName,
			int defaultTimeoutSeconds,
			ObjectMapper objectMapper,
			RestClient restClient) {
		this.apiKey = apiKey != null ? apiKey.trim() : "";
		this.modelName = modelName != null && !modelName.isBlank() ? modelName.trim() : DEFAULT_MODEL;
		this.defaultTimeoutSeconds = defaultTimeoutSeconds > 0 ? defaultTimeoutSeconds : 45;
		this.objectMapper = objectMapper;
		this.restClient = restClient;
	}

	@Override
	public String getProviderName() {
		return "groq";
	}

	@Override
	public GeneratedContentResult generate(GenerationPrompt prompt) {
		long startTime = System.currentTimeMillis();
		int maxTokens = prompt.getMaxOutputTokens() != null ? prompt.getMaxOutputTokens() : 2500;

		if (this.apiKey.isBlank()) {
			throw new IllegalStateException("Groq API key is missing. Please configure learning.ai.groq.api-key.");
		}

		String activeModel = this.modelName;
		Map<String, Object> requestPayload = buildGroqRequestBody(prompt, maxTokens, activeModel);
		String responseBody = null;
		GeneratedContentResult result = null;

		try {
			responseBody = executeRequest(requestPayload);
			result = parseGroqResponse(responseBody, startTime, activeModel);
		} catch (Exception ex) {
			// If Groq reported model_not_found (404), auto-fallback to available model
			if (ex.getMessage() != null && ex.getMessage().contains("model_not_found")
					&& !FALLBACK_MODEL.equals(activeModel)) {
				log.warn("Groq model '{}' was not found for this account (404). Attempting fallback to '{}'",
						activeModel, FALLBACK_MODEL);
				try {
					requestPayload.put("model", FALLBACK_MODEL);
					responseBody = executeRequest(requestPayload);
					result = parseGroqResponse(responseBody, startTime, FALLBACK_MODEL);
					return result;
				} catch (Exception fallbackEx) {
					log.error("Fallback to model '{}' also failed: {}", FALLBACK_MODEL, fallbackEx.getMessage());
				}
			}

			long elapsed = System.currentTimeMillis() - startTime;
			log.error("Groq AI generation failed after {} ms: {}", elapsed, ex.getMessage());
			throw new RuntimeException("AI content generation failed: " + ex.getMessage(), ex);
		}

		return result;
	}

	private String executeRequest(Map<String, Object> requestPayload) {
		return restClient.post()
				.uri("")
				.headers(headers -> {
					if (!headers.containsKey(HttpHeaders.AUTHORIZATION) && !this.apiKey.isBlank()) {
						headers.setBearerAuth(this.apiKey);
					}
				})
				.contentType(MediaType.APPLICATION_JSON)
				.body(requestPayload)
				.retrieve()
				.body(String.class);
	}

	private Map<String, Object> buildGroqRequestBody(GenerationPrompt prompt, int maxTokens, String targetModel) {
		Map<String, Object> body = new HashMap<>();
		body.put("model", targetModel);

		List<Map<String, String>> messages = new ArrayList<>();
		if (prompt.getSystemInstruction() != null && !prompt.getSystemInstruction().isBlank()) {
			messages.add(Map.of("role", "system", "content", prompt.getSystemInstruction()));
		}

		String userContent = prompt.getUserPayload() != null ? prompt.getUserPayload() : "";
		messages.add(Map.of("role", "user", "content", userContent));
		body.put("messages", messages);

		body.put("response_format", Map.of("type", "json_object"));
		body.put("temperature", 0.2);
		if (maxTokens > 0) {
			body.put("max_tokens", maxTokens);
		}

		return body;
	}

	private GeneratedContentResult parseGroqResponse(String responseBody, long startTime, String modelUsed) {
		long latencyMs = System.currentTimeMillis() - startTime;
		String rawJson = "{}";
		Integer inputTokens = null;
		Integer outputTokens = null;
		GeneratedContentResult result = null;

		try {
			JsonNode root = objectMapper.readTree(responseBody);
			JsonNode choices = root.path("choices");

			if (choices.isArray() && !choices.isEmpty()) {
				JsonNode firstChoice = choices.get(0);
				JsonNode message = firstChoice.path("message");
				rawJson = message.path("content").asText();
			}

			JsonNode usage = root.path("usage");
			if (!usage.isMissingNode()) {
				inputTokens = usage.path("prompt_tokens").asInt();
				outputTokens = usage.path("completion_tokens").asInt();
			}

			log.info("Groq generation succeeded (model={}, latencyMs={}, inTokens={}, outTokens={})",
					modelUsed, latencyMs, inputTokens, outputTokens);
		} catch (Exception parseEx) {
			log.error("Failed to parse Groq API JSON response: {}", parseEx.getMessage());
			throw new RuntimeException("Failed to parse Groq output", parseEx);
		}

		result = GeneratedContentResult.builder()
				.rawJson(rawJson)
				.inputTokens(inputTokens)
				.outputTokens(outputTokens)
				.latencyMs(latencyMs)
				.modelName(modelUsed)
				.build();

		return result;
	}
}
