package lk.ac.sliit.legacylens.home.dto;

import lombok.Data;

@Data
public class FeaturedKeeperResponse {
    private Long id;
    private String name;
    private String title;
    private String tag;
    private String quote;
    private String avatarUrl;
    private Integer likesCount;
}
