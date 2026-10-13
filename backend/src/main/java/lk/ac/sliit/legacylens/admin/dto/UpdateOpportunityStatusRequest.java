package lk.ac.sliit.legacylens.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateOpportunityStatusRequest {
    @NotBlank(message = "Status is required")
    @Pattern(regexp = "^(DRAFT|PUBLISHED|ARCHIVED|CLOSED|ACTIVE|INACTIVE)$", message = "Status must be one of: DRAFT, PUBLISHED, ARCHIVED, CLOSED, ACTIVE, INACTIVE")
    private String status;
}
