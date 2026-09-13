package lk.ac.sliit.legacylens.home.dto;

import lombok.Data;
import java.util.List;

@Data
public class FeedItemResponse {
    private String id;
    private String type;
    private String title;
    private String name;
    private String author;
    private String location;
    private List<String> tags;
    private Integer likesCount;
    private Integer commentsCount;
    
    // Video/Blog specific
    private String thumbnail;
    
    // Video specific
    private String videoUrl;
    
    // Video/Audio specific
    private String duration;
    
    // Blog specific
    private String excerpt;
    private String readTime;
    
    // Audio specific
    private String topic;
    private String avatar;
    private List<Integer> bars;
}
