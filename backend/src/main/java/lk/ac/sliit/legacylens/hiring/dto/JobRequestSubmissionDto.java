package lk.ac.sliit.legacylens.hiring.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.ac.sliit.legacylens.hiring.entity.InputMode;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

/**
 * Multipart form fields for submitting/drafting a job request. `description`
 * and `voiceNote` are both individually optional — at least one is required,
 * which JobRequestService enforces (the rule spans two fields, so it doesn't
 * belong on either field alone).
 */
@Data
public class JobRequestSubmissionDto {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    private String description;

    @NotNull(message = "Input mode is required")
    private InputMode inputMode;

    private MultipartFile voiceNote;
}
