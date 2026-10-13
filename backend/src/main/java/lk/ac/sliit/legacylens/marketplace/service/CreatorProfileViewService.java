package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.CreatorProfileResponse;

import java.util.UUID;

/** Builds a content creator's profile page for whoever is looking at it. */
public interface CreatorProfileViewService {

    /**
     * The profile of {@code creatorUserId} as seen by {@code viewerId}. The
     * private details (contact, full NIC, proof document) are included only
     * when the two are the same person. Someone else can only see creators
     * who have been verified; an unknown or unverified creator is "not found".
     */
    CreatorProfileResponse getProfile(UUID viewerId, UUID creatorUserId);
}
