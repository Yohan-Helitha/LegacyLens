package lk.ac.sliit.legacylens.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPinRequest {

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
}
