package lk.ac.sliit.legacylens.stories.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.ac.sliit.legacylens.stories.entity.StoryMethod;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

/**
 * Multipart form fields for creating a story — bound via @ModelAttribute
 * since the request also carries a file. `media` is optional: a WRITTEN
 * story has none; a RECORDED/UPLOADED one is expected to include it, but
 * that's enforced in StoryServiceImpl rather than here, since the rule
 * depends on `method`, not on any single field.
 */
@Data
public class CreateStoryRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    private String description;

    @NotNull(message = "Capture method is required")
    private StoryMethod method;

    /** Duration of `media`, in milliseconds — ignored when no file is attached. */
    private Long mediaDurationMillis;

    private MultipartFile media;
}
