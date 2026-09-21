package lk.ac.sliit.legacylens.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangePinRequest {
    @NotBlank(message = "newPin is required")
    private String newPin;
}
