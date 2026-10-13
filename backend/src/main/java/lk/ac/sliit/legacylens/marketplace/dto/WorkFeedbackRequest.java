package lk.ac.sliit.legacylens.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** A reviewer's note on a submitted piece of work: what they want changed. */
@Data
public class WorkFeedbackRequest {

    @NotBlank(message = "Please write what needs to change")
    @Size(max = 2000, message = "Feedback must be 2000 characters or fewer")
    private String message;
}
