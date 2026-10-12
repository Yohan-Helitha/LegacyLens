package lk.ac.sliit.legacylens.contentcapture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class TrustScoreDetailDto {

    private int level;
    private int storiesShared;
    /** 0 once the highest level is reached. */
    private int nextMilestoneStoriesNeeded;
}
