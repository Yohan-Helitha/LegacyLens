package lk.ac.sliit.legacylens.speech.provider;

import lk.ac.sliit.legacylens.speech.dto.AudioInput;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionOptions;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionResult;

/**
 * The abstraction {@link lk.ac.sliit.legacylens.speech.service.TranscriptionService}
 * depends on (Dependency Inversion) — no Azure (or any other vendor) class,
 * URL or header may appear outside a class implementing this interface and
 * its own config class. Swapping providers means adding one implementation
 * and changing {@code app.speech.active-provider}; the service itself never
 * changes.
 */
public interface SpeechToTextProvider {

    /** Matched against {@code app.speech.active-provider} to pick the active bean. */
    String getProviderName();

    TranscriptionResult transcribe(AudioInput audio, TranscriptionOptions options);
}
