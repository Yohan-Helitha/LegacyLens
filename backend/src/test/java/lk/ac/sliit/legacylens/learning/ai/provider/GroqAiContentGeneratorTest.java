package lk.ac.sliit.legacylens.learning.ai.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GroqAiContentGeneratorTest {

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	@DisplayName("Provider name must be groq")
	void getProviderName_returnsGroq() {
		GroqAiContentGenerator generator = new GroqAiContentGenerator(
				"gsk_test_key",
				"llama-3.3-70b-versatile",
				45,
				objectMapper
		);
		assertEquals("groq", generator.getProviderName());
	}

	@Test
	@DisplayName("Throws IllegalStateException when API key is blank")
	void generate_throwsException_whenApiKeyMissing() {
		GroqAiContentGenerator generator = new GroqAiContentGenerator(
				"",
				"llama-3.3-70b-versatile",
				45,
				objectMapper
		);

		GenerationPrompt prompt = GenerationPrompt.builder()
				.systemInstruction("System prompt")
				.userPayload("User prompt")
				.build();

		IllegalStateException ex = assertThrows(IllegalStateException.class, () -> generator.generate(prompt));
		assertTrue(ex.getMessage().contains("Groq API key is missing"));
	}

	@Test
	@DisplayName("Sends correct OpenAI-compatible payload to Groq and parses JSON response")
	void generate_sendsCorrectPayload_andReturnsParsedResult() {
		RestClient.Builder builder = RestClient.builder().baseUrl(GroqAiContentGenerator.GROQ_API_URL);
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		RestClient restClient = builder.build();

		GroqAiContentGenerator generator = new GroqAiContentGenerator(
				"gsk_test_secret_123",
				"llama-3.3-70b-versatile",
				45,
				objectMapper,
				restClient
		);

		String mockResponseBody = """
				{
				  "id": "chatcmpl-test-xyz",
				  "object": "chat.completion",
				  "choices": [
				    {
				      "index": 0,
				      "message": {
				        "role": "assistant",
				        "content": "{\\"flashcards\\": [], \\"quizQuestions\\": []}"
				      },
				      "finish_reason": "stop"
				    }
				  ],
				  "usage": {
				    "prompt_tokens": 128,
				    "completion_tokens": 256,
				    "total_tokens": 384
				  }
				}
				""";

		server.expect(requestTo("https://api.groq.com/openai/v1/chat/completions"))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer gsk_test_secret_123"))
				.andExpect(jsonPath("$.model").value("llama-3.3-70b-versatile"))
				.andExpect(jsonPath("$.response_format.type").value("json_object"))
				.andExpect(jsonPath("$.temperature").value(0.2))
				.andExpect(jsonPath("$.max_tokens").value(2000))
				.andExpect(jsonPath("$.messages[0].role").value("system"))
				.andExpect(jsonPath("$.messages[0].content").value("System instruction here"))
				.andExpect(jsonPath("$.messages[1].role").value("user"))
				.andExpect(jsonPath("$.messages[1].content").value("User payload here"))
				.andRespond(withSuccess(mockResponseBody, MediaType.APPLICATION_JSON));

		GenerationPrompt prompt = GenerationPrompt.builder()
				.systemInstruction("System instruction here")
				.userPayload("User payload here")
				.maxOutputTokens(2000)
				.build();

		GeneratedContentResult result = generator.generate(prompt);

		assertNotNull(result);
		assertEquals("{\"flashcards\": [], \"quizQuestions\": []}", result.getRawJson());
		assertEquals(128, result.getInputTokens());
		assertEquals(256, result.getOutputTokens());
		assertEquals("llama-3.3-70b-versatile", result.getModelName());
		assertNotNull(result.getLatencyMs());
		assertTrue(result.getLatencyMs() >= 0);

		server.verify();
	}

	@Test
	@DisplayName("Throws RuntimeException on downstream API error")
	void generate_throwsRuntimeException_whenApiReturnsError() {
		RestClient.Builder builder = RestClient.builder().baseUrl(GroqAiContentGenerator.GROQ_API_URL);
		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
		RestClient restClient = builder.build();

		GroqAiContentGenerator generator = new GroqAiContentGenerator(
				"gsk_test_secret_123",
				"llama-3.3-70b-versatile",
				45,
				objectMapper,
				restClient
		);

		server.expect(requestTo("https://api.groq.com/openai/v1/chat/completions"))
				.andExpect(method(HttpMethod.POST))
				.andRespond(withServerError());

		GenerationPrompt prompt = GenerationPrompt.builder()
				.userPayload("Test")
				.build();

		RuntimeException ex = assertThrows(RuntimeException.class, () -> generator.generate(prompt));
		assertTrue(ex.getMessage().contains("AI content generation failed"));

		server.verify();
	}
}
