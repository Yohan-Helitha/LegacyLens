package lk.ac.sliit.legacylens.translation.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Settings for translating user-written content with Google Cloud Translation (Basic / v2). */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.translate")
public class TranslationProperties {

    /** Cloud Translation API key. Server-side only: never log it and never send it to a client. */
    private String apiKey;

    private String endpoint = "https://translation.googleapis.com/language/translate/v2";

    /** Most texts accepted in one request. */
    private int maxTexts = 50;

    /** Longest single text accepted, in characters (Google bills per character). */
    private int maxCharsPerText = 5000;

    /** Requests one signed-in user may make per minute. */
    private int requestsPerMinute = 30;
}
