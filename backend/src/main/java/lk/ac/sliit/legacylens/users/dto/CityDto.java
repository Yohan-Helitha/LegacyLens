package lk.ac.sliit.legacylens.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class CityDto {

    private Integer id;
    private String name;
    private String region;
}
