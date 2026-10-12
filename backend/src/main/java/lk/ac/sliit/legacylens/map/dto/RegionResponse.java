package lk.ac.sliit.legacylens.map.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegionResponse {
    private Long id;
    private String code;
    private String label;
    private String regionName;
    private String description;
    private List<String> districts;
    private String districtsString;
    private Double longitude;
    private Double latitude;
    private Double zoom;
}
