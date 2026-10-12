package lk.ac.sliit.legacylens.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UpdateAdminRequest {
    private String fullName;
    private String phoneNumber;
    private String nicNumber;
    private String accountStatus;
    private String cityName;
    private String cityRegion;
}
