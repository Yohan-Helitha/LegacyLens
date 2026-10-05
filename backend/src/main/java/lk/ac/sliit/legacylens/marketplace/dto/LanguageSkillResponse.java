package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/** A language a creator speaks and how well. */
@Data
@Builder
@AllArgsConstructor
public class LanguageSkillResponse {

    private String language;

    /** BASIC, INTERMEDIATE or FLUENT. */
    private String proficiency;
}
