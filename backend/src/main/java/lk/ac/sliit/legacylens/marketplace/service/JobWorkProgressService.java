package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.WorkProgressResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/** Backs MyWorkList's progress display and ContinueMyWorkPage's workspace actions — see JobWorkProgress's javadoc. */
public interface JobWorkProgressService {

    WorkProgressResponse getProgress(UUID creatorId, UUID jobId);

    /** The progress of every job the creator has (upcoming, active and completed) in one call - what My Work and Rejected Submissions list. */
    List<WorkProgressResponse> listMyProgress(UUID creatorId);

    /** How many rejected submissions the creator has not opened Rejected Submissions to see yet. */
    long countUnseenRejected(UUID creatorId);

    /** The creator has opened Rejected Submissions - what is rejected now no longer counts as new. */
    void markRejectedSeen(UUID creatorId);

    /** Checks/unchecks one of the job's checklist items — the only thing that ever changes progressPercentage. */
    WorkProgressResponse updateChecklistItem(UUID creatorId, UUID jobId, UUID checklistItemId, boolean completed, String note);

    WorkProgressResponse updateNote(UUID creatorId, UUID jobId, String introduction, String story);

    /** "Search Context (SEO)" — replaces the search summary and keywords wholesale. */
    WorkProgressResponse updateSeo(UUID creatorId, UUID jobId, String summary, List<String> keywords);

    WorkProgressResponse addMaterial(UUID creatorId, UUID jobId, MultipartFile file);

    WorkProgressResponse removeMaterial(UUID creatorId, UUID jobId, UUID materialId);

    /** "Save As a Draft" — flags the current progress as an explicit draft. Never touches checklist completion. */
    WorkProgressResponse markDraft(UUID creatorId, UUID jobId);

    /** "Submit for Review" — clears the draft flag and stamps submittedAt. Does not force checklist items complete. */
    WorkProgressResponse submitDraft(UUID creatorId, UUID jobId);

    /** Discards all progress, materials, notes and checklist completion for a job — "Delete" on a saved draft. */
    /** The creator opened this job to work on it - it stops being "New". Only the first time counts. */
    void markOpened(UUID creatorId, UUID jobId);

    void resetProgress(UUID creatorId, UUID jobId);
}
