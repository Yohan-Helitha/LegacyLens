package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.AdminCreatorApplicationResponse;

import java.util.List;
import java.util.UUID;

/** The admin's side of "Become a Content Creator": see the applications, then approve or reject one. */
public interface CreatorApplicationReviewService {

    /** Applications with the given status (PENDING, VERIFIED or REJECTED); null or "ALL" lists every one. Newest first. */
    List<AdminCreatorApplicationResponse> list(String status);

    AdminCreatorApplicationResponse get(UUID applicationId);

    /** Marks it VERIFIED, gives the applicant the creator role and profile, and tells them. */
    AdminCreatorApplicationResponse approve(UUID applicationId, String note);

    /** Marks it REJECTED with the reason the applicant will see; they may edit and apply again. */
    AdminCreatorApplicationResponse reject(UUID applicationId, String reason);
}
