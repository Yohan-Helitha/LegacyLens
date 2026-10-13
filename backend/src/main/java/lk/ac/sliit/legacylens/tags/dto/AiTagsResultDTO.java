package lk.ac.sliit.legacylens.tags.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiTagsResultDTO {
    @Builder.Default
    private List<AiTagItemDTO> tags = new ArrayList<>();

    @Builder.Default
    private List<AiTagRelationshipDTO> relationships = new ArrayList<>();
}

