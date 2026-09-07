package lk.ac.sliit.legacylens.marketplace.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/** Bound from the "Confirm Booking" form's date/time fields — the creator's agreed slot with the elder. */
@Data
public class BookApplicationRequest {

    @NotNull(message = "Date is required")
    private LocalDate confirmedDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;
}
