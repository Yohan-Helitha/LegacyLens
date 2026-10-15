package lk.ac.sliit.legacylens.hiring.dto;

import lk.ac.sliit.legacylens.hiring.entity.JobRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class JobRequestResponse {

    private UUID id;
    private String title;
    private String description;
    private String inputMode;
    private String status;
    private String adminNotes;
    private String voiceNoteUrl;
    private LocalDateTime createdAt;

    /** Shared mapping — used by both the submit/draft write path and the read-one-request path, so they can't drift apart. */
    public static JobRequestResponse from(JobRequest jobRequest) {
        return JobRequestResponse.builder()
                .id(jobRequest.getId())
                .title(jobRequest.getTitle())
                .description(jobRequest.getDescription())
                .inputMode(jobRequest.getInputMode().name())
                .status(jobRequest.getStatus().name())
                .adminNotes(jobRequest.getAdminNotes())
                .voiceNoteUrl(jobRequest.getVoiceNoteUrl())
                .createdAt(jobRequest.getCreatedAt())
                .build();
    }
}
