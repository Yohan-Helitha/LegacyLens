package lk.ac.sliit.legacylens.tags.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TagDTO {
    private UUID id;
    private String canonicalName;
    private String normalizedName;
    private String description;
    private String languageCode;
    private String category;
    private boolean isApproved;
    private long storyCount;

    @Builder.Default
    private List<TagAliasDTO> aliases = new ArrayList<>();

    @Builder.Default
    private List<TagRelationshipDTO> relationships = new ArrayList<>();

    private String createdAt;
    private String updatedAt;
}

