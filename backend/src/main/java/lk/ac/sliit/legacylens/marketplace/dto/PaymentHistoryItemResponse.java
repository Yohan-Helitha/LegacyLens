package lk.ac.sliit.legacylens.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** One line in the "Collected" payment history — either a completed Job or a manually-logged PaymentRecord. */
@Data
@Builder
@AllArgsConstructor
public class PaymentHistoryItemResponse {

    private UUID id;

    /** Set only when this payment (or completed job) is tied to a specific opportunity. */
    private UUID jobId;
    private String opportunityTitle;
    private String elderName;

    private BigDecimal amount;
    private BigDecimal tipAmount;
    /** amount + tipAmount — what the "Collected Today" card and history rows actually display. */
    private BigDecimal totalAmount;

    /** Relative "/uploads/..." URL of the receipt/proof photo, if one was uploaded. */
    private String proofDocumentUrl;

    private LocalDateTime collectedAt;
    private String note;
}
