package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * The feedback on one submission. Which fields are filled depends on who asks: the admin gets both
 * notes, the knowledge holder only their own - the admin's note is left null for them.
 */
@Data
@Builder
@AllArgsConstructor
public class WorkFeedbackResponse {

    private UUID jobId;
    private String elderFeedback;
    private LocalDateTime elderFeedbackAt;
    private String adminFeedback;
    private LocalDateTime adminFeedbackAt;
}
