package lk.ac.sliit.legacylens.marketplace.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * multipart/form-data body for POST /api/creator-dashboard/payments — the
 * proof photo rides alongside the form fields, same pattern as
 * CreatorApplicationRequest.
 */
@Data
public class AddPaymentRequest {

    /** Which opportunity this payment is for — optional so an ad-hoc payment with no linked job is still possible. */
    private UUID jobId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    /** Defaults to zero server-side when omitted — see CreatorDashboardServiceImpl. */
    @DecimalMin(value = "0", message = "Tip cannot be negative")
    private BigDecimal tipAmount;

    @NotNull(message = "A proof of payment photo is required")
    private MultipartFile proofDocument;
}
