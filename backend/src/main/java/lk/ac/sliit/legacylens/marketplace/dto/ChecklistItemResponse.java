package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** One required task for a job, and whether this creator has completed it — see WorkChecklistProgress. */
@Data
@Builder
@AllArgsConstructor
public class ChecklistItemResponse {

    /** The OpportunityChecklistItem's id — stable for the life of the job, used to PATCH this item. */
    private UUID id;
    private String label;
    private int sortOrder;

    /** PREP/RECORD/EDIT/SUBMIT — lets the frontend update the stepper instantly on toggle, without waiting on the server round-trip. */
    private String stage;

    private boolean completed;
    private LocalDateTime completedAt;
    private String note;
}
