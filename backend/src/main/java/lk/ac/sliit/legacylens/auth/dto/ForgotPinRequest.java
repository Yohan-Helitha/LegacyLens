package lk.ac.sliit.legacylens.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ForgotPinRequest {

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "NIC number is required")
    @Size(max = 20, message = "NIC number must not exceed 20 characters")
    private String nicNumber;
}
