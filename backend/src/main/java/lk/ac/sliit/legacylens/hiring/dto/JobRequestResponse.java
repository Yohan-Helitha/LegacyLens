package lk.ac.sliit.legacylens.hiring.dto;

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
}
