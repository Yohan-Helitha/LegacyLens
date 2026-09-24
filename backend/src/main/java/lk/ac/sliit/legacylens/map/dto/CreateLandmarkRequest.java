package lk.ac.sliit.legacylens.map.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLandmarkRequest {
    private String code;

    @NotBlank(message = "Landmark name is required")
    private String name;

    private String description;
    private Double longitude;
    private Double latitude;
    private String icon;
    private String image;
    private String modelUrl;
    private String type;

    @NotBlank(message = "Region is required")
    private String region;

    private String district;
    private List<String> attachedStoryIds;
}
