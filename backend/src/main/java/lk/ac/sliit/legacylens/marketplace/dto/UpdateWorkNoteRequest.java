package lk.ac.sliit.legacylens.marketplace.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/** Bound from ContinueMyWorkPage's "Note & Written Content" fields — an empty value is valid (clears it). */
@Data
public class UpdateWorkNoteRequest {

    @Size(max = 4000, message = "Introduction is too long")
    private String introduction;

    @Size(max = 4000, message = "Story is too long")
    private String story;
}
