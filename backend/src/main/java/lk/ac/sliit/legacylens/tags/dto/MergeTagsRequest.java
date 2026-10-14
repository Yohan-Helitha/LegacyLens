package lk.ac.sliit.legacylens.tags.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class MergeTagsRequest {
    @NotNull(message = "Source tag ID is required")
    private UUID sourceTagId;

    @NotNull(message = "Target tag ID is required")
    private UUID targetTagId;
}

