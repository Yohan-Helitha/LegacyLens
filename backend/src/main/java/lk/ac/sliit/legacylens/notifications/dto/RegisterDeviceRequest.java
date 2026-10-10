package lk.ac.sliit.legacylens.notifications.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterDeviceRequest {

    @NotBlank(message = "A push token is required")
    private String token;

    /** "android" or "ios". */
    private String platform;
}
