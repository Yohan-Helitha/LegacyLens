package lk.ac.sliit.legacylens.speech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.Collections;
import java.util.List;

/**
 * Per-request transcription settings — independent of any one provider's
 * API shape, so {@link lk.ac.sliit.legacylens.speech.service.TranscriptionService}
 * never has to know what Azure (or anything else) calls these fields.
 */
@Data
@Builder
@AllArgsConstructor
public class TranscriptionOptions {

    @Builder.Default
    private String languageCode = "si-LK";

    @Builder.Default
    private List<String> phraseHints = Collections.emptyList();
}
