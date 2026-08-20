package lk.ac.sliit.legacylens.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ConfirmPhoneChangeRequest {

    @NotBlank(message = "New phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Enter a valid phone number")
    private String newPhoneNumber;

    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be 6 digits")
    private String otpCode;
}
