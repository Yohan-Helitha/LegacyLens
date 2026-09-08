package lk.ac.sliit.legacylens.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserVerificationResponse {
    private UUID id;
    private String fullName;
    private String phoneNumber;
    private boolean phoneVerified;
    private String nicNumber;
    private LocalDate dateOfBirth;
    private String profilePhotoUrl;
    private String accountStatus;
    private Integer cityId;
    private String cityName;
    private String cityRegion;
    private boolean fingerprintEnabled;
    private int failedPinAttempts;

    private List<String> roles;
    private List<AdminUserRoleDto> roleDetails;

    private String verificationStatus;
    private String roleCategory;
    private String applyingTitle;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
