package lk.ac.sliit.legacylens.tags.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiTagItemDTO {
    private UUID tagId;
    private String name;
    private String language;
    private String description;
    private String category;
    private Double confidence;
    private boolean isNew;
}

