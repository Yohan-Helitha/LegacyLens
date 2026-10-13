package lk.ac.sliit.legacylens.discovery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscoveryStoryResponse {
    private UUID id;
    private String title;
    private String description;
    private String bodyContent;
    private String imageUrl;
    private String type;
    private String authorName;
    private String district;
    private String region;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    private String publishedAt;
    private long viewCount;
    private int likesCount;
    private int commentsCount;
    private Double score;
    private String matchReason;

    // Audio-specific properties for Home Page audio cards
    private String duration;
    private String topic;
    private String mediaUrl;

    @Builder.Default
    private List<Integer> audioBars = new ArrayList<>();
}

