package lk.ac.sliit.legacylens.admin.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UpdateAdminRequest {
    @Size(max = 150, message = "Full name must not exceed 150 characters")
    private String fullName;

    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Enter a valid phone number")
    private String phoneNumber;

    @Pattern(regexp = "^([0-9]{9}[vVxX]|[0-9]{12})$", message = "Enter a valid NIC number")
    private String nicNumber;

    private String accountStatus;
    private String cityName;
    private String cityRegion;
}
