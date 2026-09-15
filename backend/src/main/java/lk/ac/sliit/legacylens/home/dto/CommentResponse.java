package lk.ac.sliit.legacylens.home.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommentResponse {
    private String id;
    private String author;
    private String avatar;
    private String text;
    private String timeAgo;
}
