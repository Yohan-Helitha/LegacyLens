package lk.ac.sliit.legacylens.home.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private String id;
    private String author;
    private String avatar;
    private String text;
    private String timeAgo;
    private String userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
