package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.hiring.dto.JobRequestSummaryDto;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;

import java.util.List;
import java.util.UUID;

/** Read path for job requests, separate from JobRequestService (write/submit) — Interface Segregation. */
public interface JobRequestQueryService {

    /** statusFilter is optional (null = every status). */
    List<JobRequestSummaryDto> getMyRequests(UUID elderId, JobRequestStatus statusFilter);
}
