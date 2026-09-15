package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** One card in OpportunityPage's Recommended/Urgent/Recent sections. */
@Data
@Builder
@AllArgsConstructor
public class OpportunityCardResponse {

    private UUID id;
    private String title;
    private String description;
    private String heroImageUrl;
    private String location;
    private String category;
    private String locationType;
    private Integer matchPercentage;
    private boolean urgent;
    private LocalDateTime dueAt;
    private String elderName;
    private String elderAvatarUrl;
    private String elderLocation;
    private LocalDateTime createdAt;
}
