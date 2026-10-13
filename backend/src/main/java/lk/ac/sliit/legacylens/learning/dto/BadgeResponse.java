package lk.ac.sliit.legacylens.learning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BadgeResponse {

    private String id;
    private String name;
    private String description;
    private boolean earned;
    private String unlockHint;
}