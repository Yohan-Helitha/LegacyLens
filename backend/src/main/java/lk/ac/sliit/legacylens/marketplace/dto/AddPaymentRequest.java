package lk.ac.sliit.legacylens.marketplace.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/** Body for POST /api/creator-dashboard/payments — a creator manually logging cash they collected. */
@Data
public class AddPaymentRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @Size(max = 200, message = "Note must not exceed 200 characters")
    private String note;
}
