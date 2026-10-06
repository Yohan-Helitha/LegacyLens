package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Full detail for OpportunityDetailPage. */
@Data
@Builder
@AllArgsConstructor
public class OpportunityDetailResponse {

    private UUID id;
    private String title;
    private String description;
    private String category;
    private String heroImageUrl;
    private String elderName;
    private String elderAvatarUrl;
    private boolean elderVerified;
    private String location;
    private LocalDate scheduledDate;
    private String durationText;
    private BigDecimal offeredAmount;
    private String timeWindowText;
    private String language;
    private String preservationGoal;
    private List<String> tasks;

    /** How well this fits the signed-in creator, 0-100; null when the user is not a creator. */
    private Integer matchPercentage;
    private String matchLevel;
    /** "Why this matches you", strongest first. */
    private List<String> matchReasons;
}
