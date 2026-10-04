package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * The private part of a creator profile: contact details, the full NIC number
 * and whether a verification document is on file. Only ever filled in when the
 * creator is looking at their own profile - everyone else gets null.
 * The document itself is never listed here; it is fetched through a short-lived
 * link (see CreatorProofService).
 */
@Data
@Builder
@AllArgsConstructor
public class CreatorOwnerDetailsResponse {

    private String email;
    private String phoneNumber;

    /** The full, unmasked NIC number. */
    private String nicNumber;

    /** PENDING, VERIFIED or REJECTED - null when no application is on file. */
    private String applicationStatus;

    private boolean proofUploaded;

    /** e.g. "image/jpeg" or "application/pdf" - tells the app whether it can show the document inline. */
    private String proofContentType;
}
