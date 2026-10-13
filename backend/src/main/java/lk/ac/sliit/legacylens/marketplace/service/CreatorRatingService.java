package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.CreatorReviewResponse;

import java.util.UUID;

public interface CreatorRatingService {

    /**
     * The job's knowledge holder rates the creator who did it. Only a completed job can be rated, one review
     * per job (rating again replaces it), and the creator's overall rating is recalculated straight away.
     */
    CreatorReviewResponse rateCreator(UUID elderId, UUID jobId, int rating, String comment);

    /** The knowledge holder's own review of this job, or null if they have not rated it yet. */
    CreatorReviewResponse myReview(UUID elderId, UUID jobId);
}
