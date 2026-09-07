package lk.ac.sliit.legacylens.moderation.dto;

import lombok.Data;

@Data
public class UpdateModerationStatusRequest {
    private String status;
    private String rejectionReason;
    private String rejectionNotes;
}
