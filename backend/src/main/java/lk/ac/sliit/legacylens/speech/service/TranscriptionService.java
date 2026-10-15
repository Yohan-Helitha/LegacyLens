package lk.ac.sliit.legacylens.speech.service;

import lk.ac.sliit.legacylens.speech.config.SpeechProperties;
import lk.ac.sliit.legacylens.speech.dto.AudioInput;
import lk.ac.sliit.legacylens.speech.dto.QualityHint;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionOptions;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionResponse;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionResult;
import lk.ac.sliit.legacylens.speech.exception.ProviderNotFoundException;
import lk.ac.sliit.legacylens.speech.exception.UnsupportedAudioException;
import lk.ac.sliit.legacylens.speech.provider.SpeechToTextProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Orchestration only: validate the upload, resolve the configured provider,
 * call it, score the result, build the response. Imports only
 * {@link SpeechToTextProvider} and this package's own DTOs — never a
 * concrete provider — so switching providers never touches this class.
 */
@Service
public class TranscriptionService {

    private static final Logger log = LoggerFactory.getLogger(TranscriptionService.class);

    private final List<SpeechToTextProvider> providers;
    private final AudioValidator audioValidator;
    private final QualityAssessor qualityAssessor;
    private final SpeechProperties speechProperties;

    public TranscriptionService(
            List<SpeechToTextProvider> providers,
            AudioValidator audioValidator,
            QualityAssessor qualityAssessor,
            SpeechProperties speechProperties) {
        this.providers = providers;
        this.audioValidator = audioValidator;
        this.qualityAssessor = qualityAssessor;
        this.speechProperties = speechProperties;
    }

    public TranscriptionResponse transcribe(MultipartFile audio, String languageOverride) {
        audioValidator.validate(audio);

        AudioInput audioInput = toAudioInput(audio);
        TranscriptionOptions options = TranscriptionOptions.builder()
                .languageCode(resolveLanguage(languageOverride))
                .build();
        SpeechToTextProvider provider = resolveProvider();

        TranscriptionResult result = provider.transcribe(audioInput, options);
        QualityHint qualityHint = qualityAssessor.assess(result);

        log.info(
                "Speech transcription completed: provider={} latencyMs={} audioDurationMs={} confidence={} "
                        + "phraseCount={} firstPhraseOffsetMs={} qualityHint={}",
                result.getProviderName(), result.getLatencyMs(), result.getAudioDurationMs(),
                result.getConfidence(), result.getPhraseCount(), result.getFirstPhraseOffsetMs(), qualityHint);

        return TranscriptionResponse.builder()
                .providerName(result.getProviderName())
                .text(result.getText())
                .confidence(result.getConfidence())
                .languageCode(result.getLanguageCode())
                .latencyMs(result.getLatencyMs())
                .audioDurationMs(result.getAudioDurationMs())
                .firstPhraseOffsetMs(result.getFirstPhraseOffsetMs())
                .phraseCount(result.getPhraseCount())
                .qualityHint(qualityHint)
                .build();
    }

    private AudioInput toAudioInput(MultipartFile audio) {
        try {
            return AudioInput.builder()
                    .content(audio.getBytes())
                    .contentType(audio.getContentType())
                    .originalFilename(audio.getOriginalFilename())
                    .build();
        } catch (IOException ex) {
            throw new UnsupportedAudioException("Couldn't read that recording. Please try again.");
        }
    }

    private String resolveLanguage(String languageOverride) {
        return languageOverride != null && !languageOverride.isBlank()
                ? languageOverride
                : speechProperties.getDefaultLanguage();
    }

    private SpeechToTextProvider resolveProvider() {
        String activeProvider = speechProperties.getActiveProvider();

        return providers.stream()
                .filter(provider -> provider.getProviderName().equalsIgnoreCase(activeProvider))
                .findFirst()
                .orElseThrow(() -> new ProviderNotFoundException(
                        "No speech provider named '" + activeProvider + "' is registered."));
    }
}
