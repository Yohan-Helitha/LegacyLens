package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** One line of a reviewer's queue: a piece of work a creator submitted, and where the review of it stands. */
@Data
@Builder
@AllArgsConstructor
public class WorkSubmissionSummaryResponse {

    private UUID jobId;
    private String title;
    private UUID creatorId;
    /** The opportunity the job came from; lets the knowledge holder open a chat with the creator about it. Null if it was deleted. */
    private UUID opportunityId;
    private String creatorName;
    private String elderName;
    private String category;
    private LocalDateTime submittedAt;
    /** AWAITING_REVIEW, CHANGES_REQUESTED, COMPLETED or PUBLISHED. */
    private String state;
    private boolean elderApproved;
    private boolean adminApproved;
    private LocalDateTime publishedAt;
}
