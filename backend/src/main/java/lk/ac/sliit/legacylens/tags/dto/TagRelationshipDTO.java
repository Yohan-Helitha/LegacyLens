package lk.ac.sliit.legacylens.tags.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TagRelationshipDTO {
    private UUID id;
    private UUID sourceTagId;
    private String sourceTagName;
    private UUID targetTagId;
    private String targetTagName;
    private String relationshipType;
    private Double weight;
    private String createdAt;
}

