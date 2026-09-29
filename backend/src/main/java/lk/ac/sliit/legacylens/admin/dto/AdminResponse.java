package lk.ac.sliit.legacylens.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AdminResponse {
    private UUID id;
    private String fullName;
    private String phoneNumber;
    private boolean phoneVerified;
    private String nicNumber;
    private LocalDate dateOfBirth;
    private String profilePhotoUrl;
    private String accountStatus;
    private String cityName;
    private String cityRegion;
    private boolean fingerprintEnabled;
    private int failedPinAttempts;
    private String roleType;
    private String roleStatus;
    private LocalDateTime activatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
