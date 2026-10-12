package lk.ac.sliit.legacylens.speech.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Provider-agnostic settings — everything TranscriptionService and AudioValidator need, regardless of which provider is active. */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.speech")
public class SpeechProperties {

    private String activeProvider = "azure";
    private String defaultLanguage = "si-LK";
    private long maxUploadBytes = 5 * 1024 * 1024;

    /**
     * Starting guess, not a measured value — see
     * docs/speech-testing/README.md; tune this once real elder recordings
     * have been scored against it.
     */
    private double lowConfidenceThreshold = 0.60;
}
