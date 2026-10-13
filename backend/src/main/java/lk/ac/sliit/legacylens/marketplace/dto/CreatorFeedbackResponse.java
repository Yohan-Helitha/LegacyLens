package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** One knowledge holder's feedback on one piece of work, as shown on a creator's profile. */
@Data
@Builder
public class CreatorFeedbackResponse {
    private UUID jobId;
    private String opportunityTitle;
    private String elderName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
