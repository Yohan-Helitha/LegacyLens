package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/** Powers the stats row + balance card at the top of CreatorDashboard. */
@Data
@Builder
@AllArgsConstructor
public class CreatorDashboardSummaryResponse {

    /** From CreatorProfile.rating — null until the creator has any rated jobs. */
    private BigDecimal rating;

    private long completedJobsCount;

    /** Distinct elders this creator has completed work for. */
    private long contributionsCount;

    /**
     * Total earned from completed jobs. Payment happens in cash, off-platform,
     * so this is everything earned so far — not "unpaid minus paid" (that
     * distinction arrives with the future work-progress / receipt feature).
     */
    private BigDecimal availableBalance;
}
