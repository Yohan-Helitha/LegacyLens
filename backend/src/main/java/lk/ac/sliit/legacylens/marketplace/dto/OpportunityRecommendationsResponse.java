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

    /**
     * The single top creator — only when they clear CreatorMatchScorer.BEST_MATCH_MIN
     * and can do a must-have task. Null otherwise, even if others are listed.
     */
    private RecommendedCreatorResponse bestMatch;

    /**
     * Other recommended creators, highest score first — every one at or above
     * CreatorMatchScorer.RECOMMEND_MIN. When bestMatch is null these are the
     * only recommendations.
     */
    private List<RecommendedCreatorResponse> others;

    /**
     * The creator the elder already chose for this opportunity (an invited
     * creator, or an application the elder approved / that was booked), or
     * null while the elder hasn't chosen yet. Lets the screen keep that
     * section locked after a reload.
     */
    private RecommendedCreatorResponse chosenCreator;
}
