package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** One finished piece of work in the "Previous Contribution" list. */
@Data
@Builder
@AllArgsConstructor
public class CreatorContributionResponse {

    private UUID jobId;
    private String title;
    private LocalDateTime completedAt;
}
