package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** Returned after submission and from GET /api/creator-applications/me. */
@Data
@Builder
@AllArgsConstructor
public class CreatorApplicationResponse {

    private UUID id;
    private UUID userId;
    private String fullName;
    private String phoneNumber;
    private String city;
    private String nicNumber;
    private String email;
    private String aboutYou;
    private String skills;
    private String interests;
    private java.util.List<LanguageSkillResponse> languages;
    private String experienceLevel;
    private String experienceDescription;
    /** Whether a verification document is on file. The document itself is private - see CreatorProofService. */
    private boolean proofUploaded;
    private String status;
    private LocalDateTime submittedAt;
}
