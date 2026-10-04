package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.ProofLinkResponse;

import java.util.UUID;

/**
 * Access to a creator's verification document (NIC photo, certificate...).
 * The document is private: stored files are not served directly, and the only
 * way to see one is a short-lived link that its owner asks for while signed in.
 */
public interface CreatorProofService {

    /** A short-lived link to the signed-in creator's own document; "not found" when they haven't uploaded one. */
    ProofLinkResponse createLink(UUID userId);

    /** Opens the document a link was issued for; "not found" for a forged, expired or unknown link. */
    ProofDocument open(String token);
}
