package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** A short-lived address for the creator's own verification document. */
@Data
@Builder
@AllArgsConstructor
public class ProofLinkResponse {

    /** Root-relative, e.g. "/api/creator-proofs/eyJ..." - prefix with the server address. */
    private String path;

    private String contentType;

    private LocalDateTime expiresAt;
}
