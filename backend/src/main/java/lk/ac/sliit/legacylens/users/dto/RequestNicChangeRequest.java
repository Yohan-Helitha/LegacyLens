package lk.ac.sliit.legacylens.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RequestNicChangeRequest {

    @NotBlank(message = "New NIC number is required")
    @Size(max = 20, message = "NIC number must not exceed 20 characters")
    private String newNicNumber;
}
