package lk.ac.sliit.legacylens.map.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChoiceResponse {
    private String id; // format like "c1", "c2"
    private String label;
    private String icon;
    private String image;
    @com.fasterxml.jackson.annotation.JsonProperty("isCorrect")
    private boolean isCorrect;
}
