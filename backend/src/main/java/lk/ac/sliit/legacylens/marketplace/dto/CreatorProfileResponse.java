package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * A content creator's profile page. Everything above {@code ownerDetails} is
 * safe for any signed-in user to see; {@code ownerDetails} (contact details,
 * full NIC, proof document) is null for everyone except the creator themselves.
 */
@Data
@Builder
@AllArgsConstructor
public class CreatorProfileResponse {

    private UUID userId;
    private String name;
    private String avatarUrl;
    private String city;

    /** Null until the creator has any rated jobs. */
    private BigDecimal rating;

    /** Distinct elders this creator has completed work for. */
    private long contributionsCount;

    private String aboutYou;
    private List<String> skills;
    private List<String> languages;
    private List<String> interests;

    /** NEW_TO_DOCUMENTATION, SOME_EXPERIENCE or EXPERIENCED - null when no application is on file. */
    private String experienceLevel;
    private String experienceDescription;

    private long completedCount;
    private long approvedCount;
    private long activeCount;
    private List<CreatorContributionResponse> previousContributions;

    private CreatorOwnerDetailsResponse ownerDetails;
}
