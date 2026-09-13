package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationRequest;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationResponse;

import java.util.UUID;

public interface CreatorApplicationService {

    /**
     * Submits (or, if the applicant's previous attempt was REJECTED,
     * resubmits) a "Become a Content Creator" application for the given user.
     */
    CreatorApplicationResponse submitApplication(UUID userId, CreatorApplicationRequest request);

    /** Used by the verification-pending screen to check the current status. */
    CreatorApplicationResponse getMyApplication(UUID userId);
}
