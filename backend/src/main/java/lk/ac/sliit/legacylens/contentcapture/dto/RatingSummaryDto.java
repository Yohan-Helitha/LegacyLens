package lk.ac.sliit.legacylens.contentcapture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
public class RatingSummaryDto {

    /** Null when the elder has no ratings yet. */
    private BigDecimal averageRating;
    private int ratingCount;
}
