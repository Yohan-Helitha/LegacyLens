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

    /** Removes a draft or submitted application — the Delete/Cancel action on either list. */
    void deleteApplication(UUID creatorId, UUID applicationId);
}
