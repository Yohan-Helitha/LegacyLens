package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.OpportunityCardResponse;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityDetailResponse;

import java.util.List;
import java.util.UUID;

public interface OpportunityService {

    /** Published opportunities with the highest match score first. */
    List<OpportunityCardResponse> getRecommended(int limit);

    /** Published opportunities flagged urgent, soonest deadline first. */
    List<OpportunityCardResponse> getUrgent(int limit);

    /** Published opportunities, newest first. */
    List<OpportunityCardResponse> getRecent(int limit);

    /** One published opportunity's full detail. */
    OpportunityDetailResponse getById(UUID id);
}
