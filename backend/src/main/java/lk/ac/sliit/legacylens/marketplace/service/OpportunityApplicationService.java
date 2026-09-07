package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationRequest;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OpportunityApplicationService {

    /** Creates a new SAVED draft, or updates the creator's existing draft for that opportunity in place. */
    OpportunityApplicationResponse saveDraft(UUID creatorId, OpportunityApplicationRequest request);

    /** Backs SavedOpportunityApplication's Saved + Submitted lists. */
    List<OpportunityApplicationResponse> getMyApplications(UUID creatorId);

    /** Used by OpportunityApplicationForm to prefill an existing draft when opening "Apply" for an opportunity already saved. */
    Optional<OpportunityApplicationResponse> getByOpportunity(UUID creatorId, UUID opportunityId);

    /** Moves a SAVED draft to PENDING. */
    OpportunityApplicationResponse submitApplication(UUID creatorId, UUID applicationId);

    /**
     * TEMPORARY: moves a PENDING application to APPROVED. This is normally
     * the knowledge holder's decision, but no review UI exists for them yet,
     * so the creator can self-approve their own submitted application here to
     * keep testing the rest of the booking flow. Remove once a real
     * elder-facing approval flow exists.
     */
    OpportunityApplicationResponse approveApplication(UUID creatorId, UUID applicationId);

    /** Moves an APPROVED application to BOOKED — the "Book" button on the dashboard's Upcoming Booking tab. */
    OpportunityApplicationResponse bookApplication(UUID creatorId, UUID applicationId);

    /** Removes a draft or submitted application — the Delete/Cancel action on either list. */
    void deleteApplication(UUID creatorId, UUID applicationId);
}
