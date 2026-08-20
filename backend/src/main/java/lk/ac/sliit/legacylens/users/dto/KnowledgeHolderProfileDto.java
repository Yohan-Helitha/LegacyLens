package lk.ac.sliit.legacylens.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/** Only present in the profile response if the user holds the ELDER role. */
@Data
@Builder
@AllArgsConstructor
public class KnowledgeHolderProfileDto {

    private String primaryRegion;
    private String knownTopics;
    private BigDecimal trustScore;
    private String bio;
}
