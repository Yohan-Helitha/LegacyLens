package lk.ac.sliit.legacylens.speech.provider;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.speech.config.AzureSpeechProperties;
import lk.ac.sliit.legacylens.speech.dto.AudioInput;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionOptions;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionResult;
import lk.ac.sliit.legacylens.speech.exception.SpeechProviderException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.OptionalDouble;
import java.util.Set;

/**
 * The only class in this codebase that knows Azure's fast-transcription API
 * shape — no other class imports anything from this file or references
 * Azure by name (Dependency Inversion; see {@link SpeechToTextProvider}).
 *
 * ENDPOINT SHAPE — UNVERIFIED: Microsoft's fast-transcription example uses
 * the resource's own address (https://{resource-name}.cognitiveservices.azure.com),
 * while a *regional* address (https://{region}.api.cognitive.microsoft.com)
 * is configured in this project's local properties today. Both are built
 * the same way below; which one actually works for this Azure resource can
 * only be confirmed with one real call once AZURE_SPEECH_ENDPOINT/REGION/KEY
 * are filled in locally — see docs/speech-testing/README.md. If the
 * configured endpoint 404s or 401s, swap AZURE_SPEECH_ENDPOINT for the
 * resource's own address from the Azure portal (Keys and Endpoint); no code
 * change should be needed either way, only the property value.
 */
@Component
public class AzureFastTranscriptionProvider implements SpeechToTextProvider {

    private static final Logger log = LoggerFactory.getLogger(AzureFastTranscriptionProvider.class);
    private static final String PROVIDER_NAME = "azure";
    private static final Set<Integer> RETRYABLE_STATUS_CODES = Set.of(429, 500, 502, 503, 504);
    private static final long RETRY_DELAY_MS = 500;

    private final AzureSpeechProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    /**
     * Takes a {@code RestClient.Builder} rather than calling
     * {@code RestClient.create()} directly, purely so
     * {@code AzureFastTranscriptionProviderTest} can bind a
     * {@code MockRestServiceServer} to it — Spring Boot auto-configures one
     * builder bean, so this needs no extra wiring in production.
     */
    public AzureFastTranscriptionProvider(
            AzureSpeechProperties properties, ObjectMapper objectMapper, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restClient = restClientBuilder.build();
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public TranscriptionResult transcribe(AudioInput audio, TranscriptionOptions options) {
        long startedAt = System.currentTimeMillis();

        AzureTranscriptionResponse response = callWithRetry(audio, options, /* attempt */ 1);
        long latencyMs = System.currentTimeMillis() - startedAt;

        return mapResult(response, options, latencyMs);
    }

    // ── HTTP call ────────────────────────────────────────────────────────

    private AzureTranscriptionResponse callWithRetry(AudioInput audio, TranscriptionOptions options, int attempt) {
        try {
            return callOnce(audio, options);
        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();
            boolean retryable = RETRYABLE_STATUS_CODES.contains(status);

            if (retryable && attempt == 1) {
                log.warn("Azure speech request failed with status {}, retrying once", status);
                sleep(RETRY_DELAY_MS);
                return callWithRetry(audio, options, attempt + 1);
            }

            // The response body can echo request headers back — never include it.
            throw new SpeechProviderException(
                    "Couldn't transcribe that recording right now. Please try again.", ex);
        } catch (ResourceAccessException ex) {
            if (attempt == 1) {
                log.warn("Azure speech request failed with a network error, retrying once");
                sleep(RETRY_DELAY_MS);
                return callWithRetry(audio, options, attempt + 1);
            }
            throw new SpeechProviderException(
                    "Couldn't reach the transcription service. Please check your connection and try again.", ex);
        }
    }

    private AzureTranscriptionResponse callOnce(AudioInput audio, TranscriptionOptions options) {
        String url = buildUrl();
        String definitionJson = buildDefinitionJson(options);

        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part("audio", new NamedByteArrayResource(audio.getContent(), audio.getOriginalFilename()))
                .contentType(resolveContentType(audio));
        body.part("definition", definitionJson, MediaType.APPLICATION_JSON);

        return restClient.post()
                .uri(url)
                .header("Ocp-Apim-Subscription-Key", properties.getKey())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body.build())
                .retrieve()
                .body(AzureTranscriptionResponse.class);
    }

    /** `{endpoint}/speechtotext/transcriptions:transcribe?api-version={version}`, trailing-slash safe. */
    private String buildUrl() {
        String endpoint = properties.getEndpoint();
        if (endpoint == null || endpoint.isBlank()) {
            throw new SpeechProviderException("Speech transcription isn't configured yet.");
        }
        String normalized = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;

        return normalized + "/speechtotext/transcriptions:transcribe?api-version=" + properties.getApiVersion();
    }

    private String buildDefinitionJson(TranscriptionOptions options) {
        try {
            AzureTranscriptionDefinition definition = new AzureTranscriptionDefinition();
            definition.locales = List.of(options.getLanguageCode());
            definition.profanityFilterMode = "None";
            if (properties.isPhraseListEnabled() && options.getPhraseHints() != null && !options.getPhraseHints().isEmpty()) {
                definition.phraseList = options.getPhraseHints();
            }

            return objectMapper.writeValueAsString(definition);
        } catch (Exception ex) {
            throw new SpeechProviderException("Couldn't prepare that recording for transcription.", ex);
        }
    }

    private MediaType resolveContentType(AudioInput audio) {
        if (audio.getContentType() == null || audio.getContentType().isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(audio.getContentType());
        } catch (Exception ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    // ── Response mapping ────────────────────────────────────────────────

    private TranscriptionResult mapResult(AzureTranscriptionResponse response, TranscriptionOptions options, long latencyMs) {
        List<AzurePhrase> phrases = response.phrases != null ? response.phrases : List.of();

        String text = joinCombinedPhrases(response);
        Double confidence = durationWeightedConfidence(phrases);
        Long firstPhraseOffsetMs = phrases.isEmpty() ? null : phrases.get(0).offsetMilliseconds;
        String languageCode = !phrases.isEmpty() && phrases.get(0).locale != null
                ? phrases.get(0).locale
                : options.getLanguageCode();

        return TranscriptionResult.builder()
                .providerName(PROVIDER_NAME)
                .text(text)
                .confidence(confidence)
                .languageCode(languageCode)
                .latencyMs(latencyMs)
                .audioDurationMs(response.durationMilliseconds)
                .firstPhraseOffsetMs(firstPhraseOffsetMs)
                .phraseCount(phrases.size())
                .build();
    }

    private String joinCombinedPhrases(AzureTranscriptionResponse response) {
        if (response.combinedPhrases == null || response.combinedPhrases.isEmpty()) {
            return "";
        }
        StringBuilder joined = new StringBuilder();
        for (AzureCombinedPhrase phrase : response.combinedPhrases) {
            if (phrase.text == null || phrase.text.isBlank()) continue;
            if (!joined.isEmpty()) joined.append(' ');
            joined.append(phrase.text.trim());
        }

        return joined.toString();
    }

    /** Null (not 0) when there's nothing to weight — an empty-phrase result has no confidence to report. */
    private Double durationWeightedConfidence(List<AzurePhrase> phrases) {
        double weightedSum = 0;
        long totalWeight = 0;
        for (AzurePhrase phrase : phrases) {
            if (phrase.confidence == null) continue;
            long weight = phrase.durationMilliseconds != null ? phrase.durationMilliseconds : 0;
            weightedSum += phrase.confidence * weight;
            totalWeight += weight;
        }

        if (totalWeight == 0) {
            OptionalDouble simpleAverage = phrases.stream()
                    .filter(p -> p.confidence != null)
                    .mapToDouble(p -> p.confidence)
                    .average();

            return simpleAverage.isPresent() ? simpleAverage.getAsDouble() : null;
        }

        return weightedSum / totalWeight;
    }

    // ── Azure wire format — private to this file by design ──────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class AzureTranscriptionDefinition {
        public List<String> locales;
        public String profanityFilterMode;
        public List<String> phraseList;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class AzureTranscriptionResponse {
        public Long durationMilliseconds;
        public List<AzureCombinedPhrase> combinedPhrases;
        public List<AzurePhrase> phrases;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class AzureCombinedPhrase {
        public String text;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class AzurePhrase {
        @JsonProperty("offsetMilliseconds")
        public Long offsetMilliseconds;
        @JsonProperty("durationMilliseconds")
        public Long durationMilliseconds;
        public String text;
        public String locale;
        public Double confidence;
    }

    /** ByteArrayResource with a fixed filename — Spring's multipart writer needs getFilename() non-null to set Content-Disposition. */
    private static class NamedByteArrayResource extends ByteArrayResource {
        private final String filename;

        NamedByteArrayResource(byte[] byteArray, String filename) {
            super(byteArray);
            this.filename = filename != null && !filename.isBlank() ? filename : "audio";
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}
