package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Full work-progress state for one Job — backs MyWorkList's stepper/progress bar and ContinueMyWorkPage's workspace. */
@Data
@Builder
@AllArgsConstructor
public class WorkProgressResponse {

    private UUID jobId;
    private int completedSteps;
    private int totalSteps;
    private String note;
    private boolean draft;
    private LocalDateTime submittedAt;
    private List<WorkMaterialResponse> materials;
}
