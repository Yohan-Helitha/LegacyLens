package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.WorkSubmissionDetailResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkSubmissionSummaryResponse;

import java.util.List;
import java.util.UUID;

/** What the knowledge holder and the admin read when they review a creator's submitted work. */
public interface WorkReviewService {

    /** Work submitted for this knowledge holder's own jobs, newest first. */
    List<WorkSubmissionSummaryResponse> listForElder(UUID elderId);

    /** The full submission; another knowledge holder's job is "not found". */
    WorkSubmissionDetailResponse viewForElder(UUID elderId, UUID jobId);

    /** All submitted work, newest first. */
    List<WorkSubmissionSummaryResponse> listForAdmin();

    WorkSubmissionDetailResponse viewForAdmin(UUID jobId);
}
