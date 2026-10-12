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

    /** The linked Opportunity's hero image, if this job was created via a real booking. Null otherwise. */
    private String heroImageUrl;

    /** What the opportunity pays - the same figure the opportunity page showed. */
    private java.math.BigDecimal offeredAmount;

    /** completedChecklistItems / totalChecklistItems * 100, rounded. 0 when there are no checklist items yet. */
    private int progressPercentage;

    /** PREP / RECORD / EDIT / SUBMIT / COMPLETED — derived from progressPercentage, purely a display summary. */
    private String currentStage;

    /**
     * Which of the four steps are done: Prep (every task ticked), Record (a material uploaded), Edit (introduction,
     * story and search summary written) and Submit (sent for review). Each is worth a quarter of progressPercentage.
     */
    private boolean prepDone;
    private boolean recordDone;
    private boolean editDone;
    private boolean submitted;

    private String introduction;
    private String story;

    /** "Search Context (SEO)" — short search-result description and keywords. Empty list when none are set. */
    private String seoSummary;
    private List<String> seoKeywords;
    private boolean draft;
    private LocalDateTime submittedAt;

    /** True when an admin sent this submission back for fixes — see JobWorkProgress.rejected. */
    private boolean rejected;
    private String rejectionReason;
    private LocalDateTime rejectedAt;

    /** The two reviewers' notes on this submission - shown to the creator only, never in the published content. */
    private String elderFeedback;
    private LocalDateTime elderFeedbackAt;
    private String adminFeedback;
    private LocalDateTime adminFeedbackAt;
    private List<WorkMaterialResponse> materials;
    private List<ChecklistItemResponse> checklistItems;
}
