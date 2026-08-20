package lk.ac.sliit.legacylens.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Full profile of the currently authenticated user.
 * knowledgeHolderProfile / creatorProfile are null unless the user holds
 * the corresponding role and has completed that profile.
 */
@Data
@Builder
@AllArgsConstructor
public class UserProfileResponse {

    private UUID userId;
    private String fullName;
    private String phoneNumber;
    private boolean phoneVerified;
    private LocalDate dateOfBirth;
    private String nicNumber;
    private String profilePhotoUrl;
    private boolean fingerprintEnabled;
    private String accountStatus;
    private CityDto city;
    private List<String> roles;
    private KnowledgeHolderProfileDto knowledgeHolderProfile;
    private CreatorProfileDto creatorProfile;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
