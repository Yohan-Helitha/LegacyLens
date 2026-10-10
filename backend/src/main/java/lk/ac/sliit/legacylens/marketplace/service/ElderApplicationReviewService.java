package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationResponse;

import java.util.List;
import java.util.UUID;

/**
 * The knowledge holder's side of applications: see who applied to their opportunities and
 * accept or turn down a submitted application. Only the elder who owns the opportunity can.
 */
public interface ElderApplicationReviewService {

    /** Submitted, accepted, turned-down and booked applications to this elder's opportunities - never drafts. */
    List<OpportunityApplicationResponse> getApplicationsForElder(UUID elderId);

    /** PENDING to APPROVED; the creator can then confirm a booking. */
    OpportunityApplicationResponse approve(UUID elderId, UUID applicationId);

    /** PENDING to REJECTED. */
    OpportunityApplicationResponse reject(UUID elderId, UUID applicationId);
}
