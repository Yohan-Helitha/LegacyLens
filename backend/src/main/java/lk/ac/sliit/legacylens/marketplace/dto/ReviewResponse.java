package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** One entry in CreatorDashboard's Client Feedback section. */
@Data
@Builder
@AllArgsConstructor
public class ReviewResponse {

    private UUID id;
    private Integer rating;
    private String comment;
    private String elderName;
    /** The job this feedback belongs to - each opportunity gets its own review. */
    private java.util.UUID jobId;
    /** Title of that opportunity, so a feedback line can say what the work was. */
    private String opportunityTitle;
    private LocalDateTime createdAt;
}
