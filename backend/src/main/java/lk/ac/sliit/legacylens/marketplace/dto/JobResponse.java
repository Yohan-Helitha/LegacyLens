package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** One row in the Active/Upcoming/Completed tabs or the recent-work list. */
@Data
@Builder
@AllArgsConstructor
public class JobResponse {

    private UUID id;
    private String title;
    private String description;
    private String elderName;
    private String location;
    private BigDecimal offeredAmount;
    private String status;
    private LocalDateTime scheduledAt;
    private LocalDateTime completedAt;
}
