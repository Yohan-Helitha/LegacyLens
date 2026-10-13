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
public class TagAliasDTO {
    private UUID id;
    private UUID tagId;
    private String alias;
    private String normalizedAlias;
    private String languageCode;
    private String aliasType;
    private String createdAt;
}

