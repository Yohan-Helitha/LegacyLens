package lk.ac.sliit.legacylens.translation.provider;

import lk.ac.sliit.legacylens.common.exception.TranslationUnavailableException;
import lk.ac.sliit.legacylens.translation.config.TranslationProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GoogleTranslationProviderTest {

    private static final String ENDPOINT = "https://translation.test/language/translate/v2";
    private static final String SECRET = "test-key-not-a-real-secret";

    private TranslationProperties properties;
    private MockRestServiceServer server;
    private GoogleTranslationProvider provider;

    @BeforeEach
    void setUp() {
        properties = new TranslationProperties();
        properties.setEndpoint(ENDPOINT);
        properties.setApiKey(SECRET);
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        provider = new GoogleTranslationProvider(properties, builder);
    }

    @Test
    void sendsTheKeyInAHeaderNotTheUrlAndParsesTheTranslations() {
        server.expect(requestTo(ENDPOINT))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("X-goog-api-key", SECRET))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().json("{\"q\":[\"Hello\",\"Bye\"],\"target\":\"si\",\"format\":\"text\"}"))
                .andRespond(withSuccess(
                        "{\"data\":{\"translations\":[{\"translatedText\":\"A\",\"detectedSourceLanguage\":\"en\"},{\"translatedText\":\"B\"}]}}",
                        MediaType.APPLICATION_JSON));

        assertThat(provider.translate(List.of("Hello", "Bye"), "si")).containsExactly("A", "B");
        server.verify();
    }

    @Test
    void aGoogleErrorBecomesUnavailableWithoutLeakingTheKeyOrTheText() {
        server.expect(requestTo(ENDPOINT)).andRespond(withStatus(HttpStatus.FORBIDDEN)
                .contentType(MediaType.APPLICATION_JSON).body("{\"error\":{\"message\":\"API key not valid\"}}"));

        assertThatThrownBy(() -> provider.translate(List.of("Private story text"), "ta"))
                .isInstanceOf(TranslationUnavailableException.class)
                .hasMessageNotContaining(SECRET)
                .hasMessageNotContaining("Private story text");
    }

    @Test
    void aWrongNumberOfTranslationsIsRejected() {
        server.expect(requestTo(ENDPOINT)).andRespond(withSuccess(
                "{\"data\":{\"translations\":[{\"translatedText\":\"only one\"}]}}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> provider.translate(List.of("a", "b"), "si")).isInstanceOf(TranslationUnavailableException.class);
    }

    @Test
    void isNotConfiguredWithoutAKey() {
        properties.setApiKey("  ");

        assertThat(provider.isConfigured()).isFalse();
        assertThatThrownBy(() -> provider.translate(List.of("a"), "si")).isInstanceOf(TranslationUnavailableException.class);
    }
}
