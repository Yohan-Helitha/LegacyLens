package lk.ac.sliit.legacylens.translation.provider;

import lk.ac.sliit.legacylens.common.exception.TranslationUnavailableException;
import lk.ac.sliit.legacylens.translation.config.TranslationProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;

/**
 * The only class that knows Google Cloud Translation's REST shape (Basic / v2):
 * POST {endpoint} with the key in the X-goog-api-key header and a JSON body {q: [...], target, format}.
 * The key goes in a header rather than the URL so it can't end up in access logs or error messages.
 */
@Component
public class GoogleTranslationProvider implements TranslationProvider {

    private static final Logger log = LoggerFactory.getLogger(GoogleTranslationProvider.class);

    private final TranslationProperties properties;
    private final RestClient restClient;

    public GoogleTranslationProvider(TranslationProperties properties, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.restClient = restClientBuilder.build();
    }

    @Override
    public boolean isConfigured() {
        return properties.getApiKey() != null && !properties.getApiKey().isBlank();
    }

    @Override
    public List<String> translate(List<String> texts, String targetLanguage) {
        if (!isConfigured()) {
            throw new TranslationUnavailableException("Translation isn't configured on the server yet.");
        }

        GoogleResponse response;
        try {
            response = restClient.post()
                    .uri(properties.getEndpoint())
                    .header("X-goog-api-key", properties.getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("q", texts, "target", targetLanguage, "format", "text"))
                    .retrieve()
                    .body(GoogleResponse.class);
        } catch (RestClientResponseException ex) {
            // Only the status is logged: neither the request (key, user text) nor Google's body is echoed.
            log.warn("Google Translation failed with HTTP {}", ex.getStatusCode().value());
            throw new TranslationUnavailableException("The translation service couldn't translate this right now.");
        } catch (Exception ex) {
            log.warn("Google Translation request failed: {}", ex.getClass().getSimpleName());
            throw new TranslationUnavailableException("The translation service couldn't be reached.");
        }

        if (response == null || response.data() == null || response.data().translations() == null
                || response.data().translations().size() != texts.size()) {
            throw new TranslationUnavailableException("The translation service returned an unexpected response.");
        }
        return response.data().translations().stream().map(Item::translatedText).toList();
    }

    record GoogleResponse(Data data) {
    }

    record Data(List<Item> translations) {
    }

    record Item(String translatedText, String detectedSourceLanguage) {
    }
}
