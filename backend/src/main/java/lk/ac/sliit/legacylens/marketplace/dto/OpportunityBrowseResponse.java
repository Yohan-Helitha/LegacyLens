package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/** Everything the Opportunities page shows when nothing is being searched, so it opens with one request. */
@Data
@Builder
@AllArgsConstructor
public class OpportunityBrowseResponse {

    /** At most one - the best fit for the creator; empty when nothing qualifies. */
    private List<OpportunityCardResponse> recommended;

    /** At most one - the most pressing urgent opportunity. */
    private List<OpportunityCardResponse> urgent;

    private List<OpportunityCardResponse> recent;
}
