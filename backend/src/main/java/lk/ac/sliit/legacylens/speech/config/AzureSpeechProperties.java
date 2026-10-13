package lk.ac.sliit.legacylens.speech.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Azure-only settings. Deliberately NOT nested inside {@link SpeechProperties}
 * — a second provider gets its own properties class the same shape as this
 * one, without touching the provider-agnostic settings.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.speech.azure")
public class AzureSpeechProperties {

    /**
     * Either a regional endpoint (https://{region}.api.cognitive.microsoft.com)
     * or the resource's own endpoint (https://{resource-name}.cognitiveservices.azure.com) —
     * unconfirmed which one the fast-transcription API accepts; see
     * AzureFastTranscriptionProvider's class javadoc.
     */
    private String endpoint;

    private String key;
    private String region;

    private String apiVersion = "2025-10-15";

    /** Azure's support for phraseList on si-LK is unconfirmed — off until verified. */
    private boolean phraseListEnabled = false;
}
