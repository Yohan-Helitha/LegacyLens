package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationRequest;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationResponse;

import java.util.List;
import java.util.UUID;

public interface CreatorApplicationService {

    /**
     * Submits (or, if the applicant's previous attempt was REJECTED,
     * resubmits) a "Become a Content Creator" application for the given user.
     */
    CreatorApplicationResponse submitApplication(UUID userId, CreatorApplicationRequest request);

    /** Used by the verification-pending screen to check the current status. */
    CreatorApplicationResponse getMyApplication(UUID userId);

    /**
     * Replaces the languages on the creator's own application. Languages are
     * self-declared and only fine-tune recommendations, so this works at any
     * review status and does not send the application back for review.
     */
    CreatorApplicationResponse updateMyLanguages(UUID userId, List<String> languages);
}
