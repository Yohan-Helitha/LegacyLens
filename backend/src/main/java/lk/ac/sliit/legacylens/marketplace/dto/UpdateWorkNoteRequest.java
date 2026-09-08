package lk.ac.sliit.legacylens.marketplace.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/** Bound from ContinueMyWorkPage's "Note & Written Content" field — an empty note is valid (clears it). */
@Data
public class UpdateWorkNoteRequest {

    @Size(max = 4000, message = "Note is too long")
    private String note;
}
