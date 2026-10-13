package lk.ac.sliit.legacylens.marketplace.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** A knowledge holder's star rating (and optional words) for the creator who did a completed job. */
@Data
public class CreatorReviewRequest {

    @NotNull(message = "Please choose a star rating")
    @Min(value = 1, message = "The rating must be between 1 and 5")
    @Max(value = 5, message = "The rating must be between 1 and 5")
    private Integer rating;

    @Size(max = 1000, message = "The comment must be 1000 characters or fewer")
    private String comment;
}
