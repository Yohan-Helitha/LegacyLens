package lk.ac.sliit.legacylens.contentcapture.service;

import java.util.UUID;

/**
 * Write path only — submitting a rating. Kept separate from ReviewQueryService
 * (the read path) so a caller that only displays reviews never needs to
 * depend on an interface that can also mutate ratings (Interface Segregation).
 * Also kept separate from TrustScoreService: Trust Score and Review & Rating
 * are two distinct metrics per the module's scope decision, so neither class
 * can silently absorb the other's responsibility later.
 */
public interface RatingService {

    /** Rejects self-rating (ratedByUserId == elderId). comment is optional (nullable). */
    void submitRating(UUID elderId, UUID ratedByUserId, int score, String comment);
}
