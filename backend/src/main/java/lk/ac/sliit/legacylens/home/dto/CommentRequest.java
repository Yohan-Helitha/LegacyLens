package lk.ac.sliit.legacylens.home.dto;

import lombok.Data;

@Data
public class CommentRequest {
    private String text;
    private String author;
    private String avatar;
    private String userId;
}
