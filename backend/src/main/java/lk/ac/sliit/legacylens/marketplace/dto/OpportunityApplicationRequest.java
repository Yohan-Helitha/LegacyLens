package lk.ac.sliit.legacylens.marketplace.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Bound from the "Apply to Opportunity" form's Save action.
 *
 * Deliberately lenient on everything but opportunityId — this saves a draft,
 * which the mockup allows to be partially filled in, not a final submission.
 */
@Data
public class OpportunityApplicationRequest {

    @NotNull(message = "Opportunity is required")
    private UUID opportunityId;

    private List<String> skills = List.of();

    private String experienceText;

    private String approachText;

    private boolean availabilityConfirmed;

    private List<String> equipment = List.of();
}
