package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Returned from every /api/opportunity-applications/** endpoint. The
 * opportunity-side fields (title, elderName, location, ...) are read live
 * from the linked Opportunity at response time — see OpportunityApplication's
 * javadoc for why they aren't snapshotted.
 */
@Data
@Builder
@AllArgsConstructor
public class OpportunityApplicationResponse {

    private UUID id;
    private UUID opportunityId;

    private String title;
    private String elderName;
    private String location;
    private String heroImageUrl;
    private LocalDate scheduledDate;
    private String timeWindowText;
    private BigDecimal offeredAmount;

    private List<String> skills;
    private String experienceText;
    private String approachText;
    private boolean availabilityConfirmed;
    private List<String> equipment;

    private String status;
    private LocalDateTime savedAt;
    private LocalDateTime submittedAt;
}
