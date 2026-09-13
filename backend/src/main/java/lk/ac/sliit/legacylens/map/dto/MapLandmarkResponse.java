package lk.ac.sliit.legacylens.map.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class MapLandmarkResponse {
    private String id; // maps to 'code' like "kandy"
    private String name;
    private String description;
    private Double lng;
    private Double lat;
    private String icon;
    private String image;
    private String modelUrl;
    private String region;
    
    // We can include quests summary
    private List<QuestResponse> quests;
    private BadgeResponse badge;
}
