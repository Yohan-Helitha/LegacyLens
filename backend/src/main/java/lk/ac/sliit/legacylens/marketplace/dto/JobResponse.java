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
    private boolean urgent;
    private LocalDateTime scheduledAt;
    /** Display text for the confirmed time range, e.g. "10:00 AM - 2:00 PM" — set only for Jobs created via booking. */
    private String timeWindowText;
    private LocalDateTime completedAt;
}
