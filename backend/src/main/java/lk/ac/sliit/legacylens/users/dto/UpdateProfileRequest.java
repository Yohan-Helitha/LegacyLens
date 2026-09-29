package lk.ac.sliit.legacylens.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Bound from the "Edit Your Details" form — covers only the fields that
 * don't need OTP verification (see AccountSecurityController for the
 * phone/NIC/PIN change flows, which stay separate and verified).
 */
@Data
public class UpdateProfileRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 150, message = "Full name is too long")
    private String fullName;

    /** Nullable — a creator can clear their city by omitting this. */
    private Integer cityId;
}
