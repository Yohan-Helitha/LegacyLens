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

    /**
     * Permanently removes one of the elder's own requests (and its recorded
     * Details clip, if any) — but only within DELETE_WINDOW of posting it,
     * and only while still DRAFT or PENDING_ADMIN_REVIEW, i.e. before an
     * admin has acted on it. Throws StateTransitionException otherwise.
     */
    void delete(UUID elderId, UUID jobRequestId);
}
