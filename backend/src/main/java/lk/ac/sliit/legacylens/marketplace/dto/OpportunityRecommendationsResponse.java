package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Creator recommendations for ONE of the elder's open opportunities — the
 * screen shows one section per entry, so recommendations for different
 * opportunities are never mixed together.
 */
@Data
@Builder
@AllArgsConstructor
public class OpportunityRecommendationsResponse {

    private RecommendationOpportunitySummaryResponse opportunity;

    /** The single highest-scoring creator, or null when nobody matches yet. */
    private RecommendedCreatorResponse bestMatch;

    /** The next-best matches, highest score first. */
    private List<RecommendedCreatorResponse> others;

    /**
     * The creator the elder already chose for this opportunity (an invited
     * creator, or an application the elder approved / that was booked), or
     * null while the elder hasn't chosen yet. Lets the screen keep that
     * section locked after a reload.
     */
    private RecommendedCreatorResponse chosenCreator;
}
