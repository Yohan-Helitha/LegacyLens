package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.OpportunityCardResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityDetailResponse;

import java.util.List;
import java.util.UUID;

public interface OpportunityService {

    /**
     * Opportunities recommended to this creator, best match first. Only opportunities the
     * creator can realistically take are considered (open, not past its deadline, not already
     * applied for or booked, no clash with an existing job), and only those scoring at least
     * {@value lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer#CREATOR_RECOMMEND_MIN}%.
     * Empty when the user is not an active, verified creator.
     */
    List<OpportunityCardResponse> getRecommended(int limit, UUID creatorId);

    /** Published opportunities flagged urgent, soonest deadline first. */
    List<OpportunityCardResponse> getUrgent(int limit, UUID creatorId);

    /** Published opportunities, newest first. */
    List<OpportunityCardResponse> getRecent(int limit, UUID creatorId);

    /** One published opportunity's full detail, with how well it fits the signed-in creator. */
    OpportunityDetailResponse getById(UUID id, UUID creatorId);

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
