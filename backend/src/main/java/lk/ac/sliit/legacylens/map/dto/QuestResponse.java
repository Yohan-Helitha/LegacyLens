package lk.ac.sliit.legacylens.map.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuestResponse {
    private Long id;
    private String title;
    private String description;
}
