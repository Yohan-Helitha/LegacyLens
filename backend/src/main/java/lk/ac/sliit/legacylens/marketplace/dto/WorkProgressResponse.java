package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Full work-progress state for one Job — backs MyWorkList's stepper/progress
 * bar and ContinueMyWorkPage's workspace.
 *
 * progressPercentage and currentStage are always computed from checklistItems
 * (completed count / total count) — never stored or manually incremented, so
 * the UI can never show a percentage the checklist itself doesn't back up.
 */
@Data
@Builder
@AllArgsConstructor
public class WorkProgressResponse {

    private UUID jobId;

    /** completedChecklistItems / totalChecklistItems * 100, rounded. 0 when there are no checklist items yet. */
    private int progressPercentage;

    /** PREP / RECORD / EDIT / SUBMIT / COMPLETED — derived from progressPercentage, purely a display summary. */
    private String currentStage;

    private String note;
    private boolean draft;
    private LocalDateTime submittedAt;
    private List<WorkMaterialResponse> materials;
    private List<ChecklistItemResponse> checklistItems;
}
