package lk.ac.sliit.legacylens.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CreateOpportunityRequest {
    @Size(max = 200)
    private String title;

    private String description;

    @Size(max = 500)
    private String heroImageUrl;

    @Size(max = 150)
    private String location;

    @Size(max = 50)
    private String category;

    @Size(max = 30)
    private String locationType;

    private Integer matchPercentage;

    private Boolean urgent;

    private LocalDateTime dueAt;

    private LocalDate scheduledDate;

    @Size(max = 50)
    private String durationText;

    @Size(max = 50)
    private String timeWindowText;

    @Size(max = 50)
    private String language;

    private BigDecimal offeredAmount;

    private String preservationGoal;

    private String tasks;

    @Size(max = 20)
    private String status;

    private UUID elderId;

    @Size(max = 150)
    private String elderName;
}
