package lk.ac.sliit.legacylens.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpportunityTranscriptionResponse {

    private String audioId;
    private String fullSinhalaText;
    private String fullEnglishText;
    private List<TranscriptSegment> transcriptOriginal;
    private List<TranscriptSegment> transcriptTranslation;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TranscriptSegment {
        private String time;
        private String text;
        private boolean active;
    }
}

