package lk.ac.sliit.legacylens.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserVerificationRequest {

    /**
     * Target verification status (e.g. "VERIFIED", "REJECTED", "PENDING", "ACTIVE",
     * "INACTIVE", "SUSPENDED")
     */
    @NotBlank(message = "Status is required")
    private String status;

    /**
     * Target role to activate or modify (e.g. "ELDER", "YOUTH_CREATOR",
     * "GENERAL_USER", "ADMIN").
     * If omitted, applies to all non-general roles or updates account status.
     */
    private String roleType;

    /**
     * Optional audit or rejection note.
     */
    private String notes;
}
