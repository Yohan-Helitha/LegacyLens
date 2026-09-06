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
    private BigDecimal amount;
    private LocalDateTime collectedAt;
    private String note;
}
