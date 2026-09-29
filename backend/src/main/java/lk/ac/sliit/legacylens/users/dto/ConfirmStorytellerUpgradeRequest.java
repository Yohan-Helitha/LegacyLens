package lk.ac.sliit.legacylens.users.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmStorytellerUpgradeRequest {

    @NotBlank(message = "OTP code is required")
    private String otpCode;
}
