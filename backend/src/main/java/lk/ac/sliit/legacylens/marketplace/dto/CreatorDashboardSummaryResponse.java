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
     * Cash collected today — jobs completed today plus any manually-logged
     * PaymentRecord entries for today. Payment happens in cash, off-platform;
     * there's no online balance to "withdraw", so this deliberately resets
     * daily rather than accumulating like a wallet.
     */
    private BigDecimal collectedToday;
}
