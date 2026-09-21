package lk.ac.sliit.legacylens.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class AdminOpportunityResponse {
    private UUID id;
    private String title;
    private String description;
    private String heroImageUrl;
    private String location;
    private String category;
    private String locationType;
    private Integer matchPercentage;
    private boolean urgent;
    private String dueAt;
    private LocalDate scheduledDate;
    private String durationText;
    private String timeWindowText;
    private String language;
    private BigDecimal offeredAmount;
    private String preservationGoal;
    private String tasks;
    private String status;
    private String elderId;
    private String elderName;
    private String createdAt;
    private String updatedAt;
}
