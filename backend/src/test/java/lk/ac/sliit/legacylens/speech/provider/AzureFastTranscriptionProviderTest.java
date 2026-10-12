package lk.ac.sliit.legacylens.speech.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.speech.config.AzureSpeechProperties;
import lk.ac.sliit.legacylens.speech.dto.AudioInput;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionOptions;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionResult;
import lk.ac.sliit.legacylens.speech.exception.SpeechProviderException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withUnauthorizedRequest;

class AzureFastTranscriptionProviderTest {

    private static final String TEST_ENDPOINT = "https://test-resource.cognitiveservices.azure.com";
    private static final String TEST_KEY = "super-secret-azure-key-do-not-leak";
    private static final String EXPECTED_URL =
            TEST_ENDPOINT + "/speechtotext/transcriptions:transcribe?api-version=2025-10-15";

    private static final String SUCCESS_BODY = """
            {
              "durationMilliseconds": 3000,
              "combinedPhrases": [{"text": "mama kataa karanawa"}],
              "phrases": [
                {"offsetMilliseconds": 100, "durationMilliseconds": 1000, "text": "mama kataa", "locale": "si-LK", "confidence": 0.9},
                {"offsetMilliseconds": 1100, "durationMilliseconds": 2000, "text": "karanawa", "locale": "si-LK", "confidence": 0.6}
              ]
            }
            """;

    private static final String EMPTY_PHRASES_BODY = """
            {"durationMilliseconds": 0, "combinedPhrases": [], "phrases": []}
            """;

    private AzureSpeechProperties properties;
    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer mockServer;
    private AudioInput audio;
    private TranscriptionOptions options;

    @BeforeEach
    void setUp() {
        properties = new AzureSpeechProperties();
        properties.setEndpoint(TEST_ENDPOINT);
        properties.setKey(TEST_KEY);
        properties.setApiVersion("2025-10-15");

        restClientBuilder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();

        audio = AudioInput.builder()
                .content(new byte[]{1, 2, 3})
                .contentType("audio/m4a")
                .originalFilename("clip.m4a")
                .build();
        options = TranscriptionOptions.builder().languageCode("si-LK").build();
    }

    private AzureFastTranscriptionProvider newProvider() {
        return new AzureFastTranscriptionProvider(properties, new ObjectMapper(), restClientBuilder);
    }

    @Test
    void transcribe_success_computesDurationWeightedConfidence() {
        mockServer.expect(requestTo(EXPECTED_URL))
                .andRespond(withSuccess(SUCCESS_BODY, MediaType.APPLICATION_JSON));

        TranscriptionResult result = newProvider().transcribe(audio, options);

        // (0.9*1000 + 0.6*2000) / 3000 = 0.7
        assertThat(result.getConfidence()).isEqualTo(0.7);
        assertThat(result.getText()).isEqualTo("mama kataa karanawa");
        assertThat(result.getPhraseCount()).isEqualTo(2);
        assertThat(result.getFirstPhraseOffsetMs()).isEqualTo(100L);
        assertThat(result.getAudioDurationMs()).isEqualTo(3000L);
        assertThat(result.getProviderName()).isEqualTo("azure");
        mockServer.verify();
    }

    @Test
    void transcribe_emptyPhrases_isNotAnError() {
        mockServer.expect(requestTo(EXPECTED_URL))
                .andRespond(withSuccess(EMPTY_PHRASES_BODY, MediaType.APPLICATION_JSON));

        TranscriptionResult result = newProvider().transcribe(audio, options);

        assertThat(result.getText()).isEmpty();
        assertThat(result.getPhraseCount()).isZero();
        assertThat(result.getConfidence()).isNull();
        assertThat(result.getFirstPhraseOffsetMs()).isNull();
        mockServer.verify();
    }

    @Test
    void transcribe_401_doesNotRetry() {
        mockServer.expect(requestTo(EXPECTED_URL)).andRespond(withUnauthorizedRequest());

        SpeechProviderException ex = assertThrows(
                SpeechProviderException.class, () -> newProvider().transcribe(audio, options));

        assertThat(ex.getMessage()).doesNotContain(TEST_KEY);
        mockServer.verify(); // only the one expectation declared — a retry would fail verification with an unmatched request
    }

    @Test
    void transcribe_429ThenSuccess_retriesOnce() {
        mockServer.expect(requestTo(EXPECTED_URL)).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        mockServer.expect(requestTo(EXPECTED_URL)).andRespond(withSuccess(SUCCESS_BODY, MediaType.APPLICATION_JSON));

        TranscriptionResult result = newProvider().transcribe(audio, options);

        assertThat(result.getText()).isEqualTo("mama kataa karanawa");
        mockServer.verify();
    }

    @Test
    void transcribe_500Twice_failsAfterOneRetry() {
        mockServer.expect(requestTo(EXPECTED_URL)).andRespond(withServerError());
        mockServer.expect(requestTo(EXPECTED_URL)).andRespond(withServerError());

        SpeechProviderException ex = assertThrows(
                SpeechProviderException.class, () -> newProvider().transcribe(audio, options));

        assertThat(ex.getMessage()).doesNotContain(TEST_KEY);
        mockServer.verify();
    }
}
