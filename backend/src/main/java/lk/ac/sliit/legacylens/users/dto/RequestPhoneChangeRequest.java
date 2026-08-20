package lk.ac.sliit.legacylens.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RequestPhoneChangeRequest {

    @NotBlank(message = "New phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Enter a valid phone number")
    private String newPhoneNumber;
}
