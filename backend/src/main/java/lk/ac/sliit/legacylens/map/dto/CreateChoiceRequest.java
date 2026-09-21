package lk.ac.sliit.legacylens.map.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChoiceRequest {
    private String label;
    private String icon;
    private String image;
    private boolean isCorrect;
}
