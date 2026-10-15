package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * What a content creator may see about the knowledge holder behind an opportunity. Public details only -
 * never the phone number, NIC or date of birth.
 */
@Data
@Builder
@AllArgsConstructor
public class ElderProfileResponse {

    private String name;
    private String avatarUrl;
    private boolean verified;
    /** Home city, or the region they represent when no city is set. */
    private String location;
    private String bio;
    /** Topics they can speak about, as readable words. */
    private List<String> topics;
    /** Average rating given by creators; null until rated. */
    private BigDecimal averageRating;
    private int ratingCount;
    private LocalDate memberSince;
    /** How many of their opportunities are open for creators right now. */
    private int openOpportunities;
}
