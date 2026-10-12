package lk.ac.sliit.legacylens.hiring.service;

import java.util.UUID;

/** Approve/reject a creator's application to an elder's job request. */
public interface JobApplicationReviewService {

    /**
     * Within a single transaction: accepts the target application, rejects
     * every other still-PENDING application for the same job request
     * (business rule: one creator per job), closes the parent job request,
     * and opens a messaging conversation with the accepted creator.
     */
    void approve(UUID jobRequestId, UUID applicationId, UUID elderId);

    /** reason is optional (nullable) — an elder is never required to explain a rejection. */
    void reject(UUID jobRequestId, UUID applicationId, UUID elderId, String reason);
}
