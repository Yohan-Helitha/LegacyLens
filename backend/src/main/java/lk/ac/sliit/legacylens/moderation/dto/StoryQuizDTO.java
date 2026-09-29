package lk.ac.sliit.legacylens.moderation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryQuizDTO {
    private String id;
    private String storyId;
    private String question;
    private String explanation;
    private List<StoryQuizOptionDTO> options;
}
