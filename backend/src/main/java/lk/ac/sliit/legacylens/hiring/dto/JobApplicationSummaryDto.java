package lk.ac.sliit.legacylens.hiring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class JobApplicationSummaryDto {

    private UUID id;
    private UUID creatorId;
    private String creatorName;
    /** Null if the creator has no CreatorProfile rating yet. */
    private BigDecimal creatorRating;
    private String message;
    private String status;
    private LocalDateTime appliedAt;
}
