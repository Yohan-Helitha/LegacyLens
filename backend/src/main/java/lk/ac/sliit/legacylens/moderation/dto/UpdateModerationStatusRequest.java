package lk.ac.sliit.legacylens.moderation.dto;

import lombok.Data;

@Data
public class UpdateModerationStatusRequest {
    private String status;
    private String region;
    private String district;
    private String rejectionReason;
    private String rejectionNotes;
    private String reason;
    private String notes;

    public String getEffectiveRejectionReason() {
        if (rejectionReason != null && !rejectionReason.isBlank()) {
            return rejectionReason;
        }
        return reason;
    }

    public String getEffectiveRejectionNotes() {
        if (rejectionNotes != null && !rejectionNotes.isBlank()) {
            return rejectionNotes;
        }
        return notes;
    }
}
