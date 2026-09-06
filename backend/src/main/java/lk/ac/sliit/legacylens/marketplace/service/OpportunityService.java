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
}
