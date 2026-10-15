package lk.ac.sliit.legacylens.contentcapture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/** The elder dashboard's analytics card — all-time totals plus a last-7-days vs previous-7-days view trend. */
@Data
@Builder
@AllArgsConstructor
public class AnalyticsSummaryDto {

    private int publishedStories;
    private long totalViews;
    private long viewsLast7Days;
    private long viewsPrevious7Days;
    /** Signed percent change of the last 7 days against the 7 before; 100 when views appear from a zero base. */
    private int trendPercent;
    /** True when the last 7 days beat the previous 7 — drives the green up arrow; otherwise the orange down arrow. */
    private boolean trending;
    private long totalLikes;
    private long totalComments;
    /** Title of the author's most-viewed published story; null when there are none. */
    private String topStoryTitle;
}
