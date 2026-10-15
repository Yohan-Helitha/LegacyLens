package lk.ac.sliit.legacylens.speech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import lombok.NoArgsConstructor;
import java.util.List;

/**
 * What a {@link lk.ac.sliit.legacylens.speech.provider.SpeechToTextProvider}
 * hands back — provider-agnostic, so {@code TranscriptionService} can score
 * and respond without knowing which provider produced it.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TranscriptionResult {

    private String providerName;
    private String text;

    /** Duration-weighted average across phrases; null when nothing was transcribed. */
    private Double confidence;

    private String languageCode;
    private long latencyMs;
    private Long audioDurationMs;

    /** Null when no phrase was detected at all. */
    private Long firstPhraseOffsetMs;

    private int phraseCount;

    /** Individual timestamped phrases recognized by the provider. */
    private List<TranscriptionPhrase> phrases;
}
