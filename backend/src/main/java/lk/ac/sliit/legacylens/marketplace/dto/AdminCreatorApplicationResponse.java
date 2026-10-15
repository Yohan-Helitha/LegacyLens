package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** One "Become a Content Creator" application, with everything an admin needs to decide on it. */
@Data
@Builder
@AllArgsConstructor
public class AdminCreatorApplicationResponse {

    private UUID id;
    private UUID userId;
    private String fullName;
    private String phoneNumber;
    private List<String> additionalPhoneNumbers;
    private String city;
    private String nicNumber;
    private String email;
    private String aboutYou;
    private String skills;
    private String interests;
    private List<LanguageSkillResponse> languages;
    private String experienceLevel;
    private String experienceDescription;
    /** Relative URL of the proof document - admins may open it; it is never shown to other users. */
    private String proofDocumentUrl;
    /** PENDING, VERIFIED or REJECTED. */
    private String status;
    private LocalDateTime submittedAt;
    private String reviewNote;
    private LocalDateTime reviewedAt;
}
