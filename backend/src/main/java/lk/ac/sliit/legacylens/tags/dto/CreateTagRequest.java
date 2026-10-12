package lk.ac.sliit.legacylens.tags.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateTagRequest {
    @NotBlank(message = "Canonical name is required")
    private String canonicalName;
    private String description;
    private String languageCode;
    private String category;
    private Boolean isApproved;
}

