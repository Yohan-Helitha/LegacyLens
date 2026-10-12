package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/** The review as saved, plus the creator's new overall rating so the caller can show it straight away. */
@Data
@Builder
public class CreatorReviewResponse {
    private UUID jobId;
    private Integer rating;
    private String comment;
    /** The creator's average after this review. */
    private BigDecimal creatorRating;
    private int creatorRatingCount;
}
