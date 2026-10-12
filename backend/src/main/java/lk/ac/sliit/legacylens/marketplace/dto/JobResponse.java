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
    /** The linked opportunity's category (e.g. "Oral History"); null for jobs with no opportunity behind them. */
    private String category;
    /** The linked opportunity's language, as the opportunity detail page shows it; null when there is none. */
    private String language;
    /** The knowledge holder's star rating for this job; null until they have rated it. */
    private Integer reviewRating;
    /** The knowledge holder's written feedback for this job; null when none. */
    private String reviewComment;
}
