package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.hiring.dto.JobRequestResponse;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestSummaryDto;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;

import java.util.List;
import java.util.UUID;

/** Read path for job requests, separate from JobRequestService (write/submit) — Interface Segregation. */
public interface JobRequestQueryService {

    /** statusFilter is optional (null = every status). */
    List<JobRequestSummaryDto> getMyRequests(UUID elderId, JobRequestStatus statusFilter);

    /**
     * The full detail of one of the elder's own requests — title, description/
     * voiceNoteUrl, status, admin notes — for "My Requests" (Screen 9)
     * tapping back into a request it already listed only a summary of.
     */
    JobRequestResponse getById(UUID elderId, UUID jobRequestId);
}
