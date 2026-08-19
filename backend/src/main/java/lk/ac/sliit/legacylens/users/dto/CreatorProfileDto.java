package lk.ac.sliit.legacylens.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/** Only present in the profile response if the user holds the YOUTH_CREATOR role. */
@Data
@Builder
@AllArgsConstructor
public class CreatorProfileDto {

    private String skills;
    private String interests;
    private String verificationStatus;
    private BigDecimal rating;
}
