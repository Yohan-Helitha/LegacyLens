package lk.ac.sliit.legacylens.marketplace.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Bound from a checklist row's checkbox on ContinueMyWorkPage. */
@Data
public class UpdateChecklistItemRequest {

    @NotNull(message = "completed is required")
    private Boolean completed;

    @Size(max = 2000, message = "Note is too long")
    private String note;
}
