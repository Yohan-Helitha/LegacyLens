package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Everything a creator put into a submission - what a reviewer reads before approving it or asking for
 * changes. The knowledge holder never receives the admin's note, so adminFeedback is null for them.
 */
@Data
@Builder
@AllArgsConstructor
public class WorkSubmissionDetailResponse {

    private WorkSubmissionSummaryResponse summary;
    /** What the opportunity asked for - the brief the work is judged against. */
    private String brief;
    private String introduction;
    private String story;
    private String seoSummary;
    private List<String> seoKeywords;
    /** The photos, videos and recordings the creator attached. */
    private List<WorkMaterialResponse> materials;
    private String elderFeedback;
    private LocalDateTime elderFeedbackAt;
    private String adminFeedback;
    private LocalDateTime adminFeedbackAt;
}
