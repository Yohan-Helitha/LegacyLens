package lk.ac.sliit.legacylens.speech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TranscriptionPhrase {
    private Long offsetMs;
    private Long durationMs;
    private String text;
    private Double confidence;
}
