package lk.ac.sliit.legacylens.map.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuestionRequest {
    private String riddle;
    private String image;
    private List<CreateChoiceRequest> choices;
}
