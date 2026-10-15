package lk.ac.sliit.legacylens.speech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * The raw clip handed to a {@link lk.ac.sliit.legacylens.speech.provider.SpeechToTextProvider}.
 * Framework-free on purpose — holding the bytes directly, rather than a
 * {@code MultipartFile}, means a provider never needs a servlet dependency.
 */
@Data
@Builder
@AllArgsConstructor
public class AudioInput {

    private byte[] content;
    private String contentType;
    private String originalFilename;
}
