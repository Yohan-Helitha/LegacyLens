package lk.ac.sliit.legacylens.speech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/** Body of {@code POST /api/speech/transcribe}'s {@code ApiResponse.data}. */
@Data
@Builder
@AllArgsConstructor
public class TranscriptionResponse {

    private String providerName;
    private String text;
    private Double confidence;
    private String languageCode;
    private long latencyMs;
    private Long audioDurationMs;
    private Long firstPhraseOffsetMs;
    private int phraseCount;
    private QualityHint qualityHint;
}
