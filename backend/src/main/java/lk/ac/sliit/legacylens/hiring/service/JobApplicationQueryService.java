package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.hiring.dto.JobApplicationSummaryDto;

import java.util.List;
import java.util.UUID;

/** Read path for a job request's applicants — separate from JobApplicationReviewService (approve/reject). */
public interface JobApplicationQueryService {

    /** Throws if jobRequestId doesn't exist or isn't owned by elderId. */
    List<JobApplicationSummaryDto> getApplications(UUID jobRequestId, UUID elderId);
}
