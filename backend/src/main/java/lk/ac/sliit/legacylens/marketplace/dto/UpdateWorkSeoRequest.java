package lk.ac.sliit.legacylens.marketplace.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/** Bound from ContinueMyWorkPage's "Search Context (SEO)" fields — empty values are valid (clears them). */
@Data
public class UpdateWorkSeoRequest {

    @Size(max = 160, message = "Search summary must not exceed 160 characters")
    private String summary;

    @Size(max = 10, message = "Add at most 10 keywords")
    private List<@Size(max = 30, message = "Each keyword must not exceed 30 characters") String> keywords;
}
