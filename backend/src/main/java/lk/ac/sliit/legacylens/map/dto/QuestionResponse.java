package lk.ac.sliit.legacylens.map.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class QuestionResponse {
    private String riddle;
    private String image;
    private List<ChoiceResponse> choices;
}
