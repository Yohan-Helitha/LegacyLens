package lk.ac.sliit.legacylens.stories.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * JSON body for editing a saved story's title/description. Media isn't
 * editable here — there's no re-upload endpoint, only create/delete for
 * the clip itself.
 */
@Data
public class UpdateStoryRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    private String description;
}
