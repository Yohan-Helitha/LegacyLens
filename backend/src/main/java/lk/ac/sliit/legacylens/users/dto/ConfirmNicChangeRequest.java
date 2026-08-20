package lk.ac.sliit.legacylens.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ConfirmNicChangeRequest {

    @NotBlank(message = "New NIC number is required")
    @Size(max = 20, message = "NIC number must not exceed 20 characters")
    private String newNicNumber;

    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be 6 digits")
    private String otpCode;
}
