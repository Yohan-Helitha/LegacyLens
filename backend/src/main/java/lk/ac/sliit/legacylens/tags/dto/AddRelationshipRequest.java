package lk.ac.sliit.legacylens.tags.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AddRelationshipRequest {
    @NotNull(message = "Target tag ID is required")
    private UUID targetTagId;
    private String relationshipType;
    private Double weight;
}

