package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.OpportunityRecommendationsResponse;

import java.util.List;
import java.util.UUID;

/** Backs the elder's Content Creator Recommendation screen ("Hire a Creator" in the elder drawer). */
public interface CreatorRecommendationService {

    /**
     * One entry per open (PUBLISHED) opportunity the elder owns, newest first —
     * COMPLETED/CLOSED opportunities never appear. Each entry carries its own
     * best match and other matches.
     */
    List<OpportunityRecommendationsResponse> getMyRecommendations(UUID elderId);

    /**
     * The elder picks a recommended creator for one of their open
     * opportunities. Approves the creator's application if they've already
     * applied; otherwise records an invitation. Only one creator can be chosen
     * per opportunity — choosing the same creator again is a no-op.
     */
    void chooseCreator(UUID elderId, UUID opportunityId, UUID creatorId);
}
