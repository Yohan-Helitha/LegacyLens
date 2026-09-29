package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

/** The published opportunity a set of creator recommendations belongs to. */
@Data
@Builder
@AllArgsConstructor
public class RecommendationOpportunitySummaryResponse {

    private UUID opportunityId;
    private String title;
    private String heroImageUrl;
    private String category;
    private String location;
    private String language;
    private LocalDate scheduledDate;
}
