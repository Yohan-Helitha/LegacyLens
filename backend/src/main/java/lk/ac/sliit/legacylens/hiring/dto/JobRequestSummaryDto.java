package lk.ac.sliit.legacylens.hiring.dto;

import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** Row shape for "My Hire Requests" — see JobRequestQueryService. Built directly by a JPQL constructor projection. */
@Data
@AllArgsConstructor
public class JobRequestSummaryDto {

    private UUID id;
    private String title;
    private JobRequestStatus status;
    private Long applicantCount;
    private LocalDateTime createdAt;
}
