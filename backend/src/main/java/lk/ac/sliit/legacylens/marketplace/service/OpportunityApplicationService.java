package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.BookApplicationRequest;
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
     * Moves an APPROVED application to BOOKED and creates the real Job that
     * backs it — the "Confirm Booking" form on the dashboard's Upcoming
     * Booking tab. The creator's agreed date/time in the request becomes the
     * new Job's schedule, which is why this Job then shows up automatically
     * everywhere Jobs already do (Active/Upcoming tabs, the Schedule page).
     */
    OpportunityApplicationResponse bookApplication(UUID creatorId, UUID applicationId, BookApplicationRequest request);

    /** Marks every rejected application the creator had not looked at as seen, clearing the red number on the menu. */
    void markRejectedSeen(UUID creatorId);

    /** Removes a draft or submitted application — the Delete/Cancel action on either list. */
    void deleteApplication(UUID creatorId, UUID applicationId);
}
