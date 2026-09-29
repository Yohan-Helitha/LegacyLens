package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.OpportunityCardResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityDetailResponse;

import java.util.List;
import java.util.UUID;

public interface OpportunityService {

    /**
     * Published opportunities with the highest match score first.
     *
     * @param creatorId the logged-in creator, used to personalise each card's
     *                  matchPercentage; pass null to fall back to the static
     *                  seeded value.
     */
    List<OpportunityCardResponse> getRecommended(int limit, UUID creatorId);

    /** Published opportunities flagged urgent, soonest deadline first. */
    List<OpportunityCardResponse> getUrgent(int limit, UUID creatorId);

    /** Published opportunities, newest first. */
    List<OpportunityCardResponse> getRecent(int limit, UUID creatorId);

    /** One published opportunity's full detail. */
    OpportunityDetailResponse getById(UUID id);

    /**
     * Backs the filter chips. category is matched case-insensitively as a
     * substring against Opportunity.category; pass null to not filter on it.
     * When nearby is true, results are restricted to opportunities whose
     * location mentions the creator's own city — if the creator has no city
     * set, this correctly returns no results rather than silently ignoring
     * the filter.
     */
    List<OpportunityCardResponse> search(int limit, UUID creatorId, String category, boolean nearby);
}
