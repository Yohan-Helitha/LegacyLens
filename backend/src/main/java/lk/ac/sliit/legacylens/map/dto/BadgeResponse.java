package lk.ac.sliit.legacylens.map.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BadgeResponse {
    private String id;
    private String title;
    private String image;
}
