package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** One recommended content creator on the elder's Content Creator Recommendation screen. */
@Data
@Builder
@AllArgsConstructor
public class RecommendedCreatorResponse {

    private UUID creatorId;
    private String name;
    private String avatarUrl;

    /**
     * How well this creator fits the opportunity, 0–100 (see CreatorMatchScorer).
     * Null only for an already-chosen creator who no longer ranks — never a guess.
     */
    private Integer matchPercentage;

    /** 0.00–5.00, or null for a creator with no ratings yet. */
    private BigDecimal rating;

    private long completedJobs;

    /** The creator's first listed skill, e.g. "Video Documentation". */
    private String specialty;

    /** Languages mentioned in the creator's profile/application, e.g. ["Sinhala", "English"]. */
    private List<LanguageSkillResponse> languages;

    /** The creator's own "about you" text from their creator application. */
    private String about;

    /** Plain-language reasons this creator matches the opportunity, strongest first. */
    private List<String> reasons;
}
