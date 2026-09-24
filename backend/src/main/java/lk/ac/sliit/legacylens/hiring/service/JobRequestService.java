package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.hiring.dto.JobRequestResponse;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestSubmissionDto;

import java.util.UUID;

/** Owns creation/submission of job requests. Separate from JobRequestQueryService (Interface Segregation). */
public interface JobRequestService {

    /** Creates directly with status PENDING_ADMIN_REVIEW, skipping DRAFT, and notifies the admin queue. */
    JobRequestResponse submit(UUID elderId, JobRequestSubmissionDto request);

    /** Creates with status DRAFT — no admin notification until submitDraft() promotes it. */
    JobRequestResponse saveDraft(UUID elderId, JobRequestSubmissionDto request);

    /** Transitions an existing DRAFT to PENDING_ADMIN_REVIEW and notifies the admin queue. */
    JobRequestResponse submitDraft(UUID elderId, UUID jobRequestId);
}
