package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.WorkProgressResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/** Backs MyWorkList's progress display and ContinueMyWorkPage's workspace actions — see JobWorkProgress's javadoc. */
public interface JobWorkProgressService {

    WorkProgressResponse getProgress(UUID creatorId, UUID jobId);

    /** Checks/unchecks one of the job's checklist items — the only thing that ever changes progressPercentage. */
    WorkProgressResponse updateChecklistItem(UUID creatorId, UUID jobId, UUID checklistItemId, boolean completed, String note);

    WorkProgressResponse updateNote(UUID creatorId, UUID jobId, String note);

    WorkProgressResponse addMaterial(UUID creatorId, UUID jobId, MultipartFile file);

    WorkProgressResponse removeMaterial(UUID creatorId, UUID jobId, UUID materialId);

    /** "Save As a Draft" — flags the current progress as an explicit draft. Never touches checklist completion. */
    WorkProgressResponse markDraft(UUID creatorId, UUID jobId);

    /** "Submit for Review" — clears the draft flag and stamps submittedAt. Does not force checklist items complete. */
    WorkProgressResponse submitDraft(UUID creatorId, UUID jobId);

    /** Discards all progress, materials, notes and checklist completion for a job — "Delete" on a saved draft. */
    void resetProgress(UUID creatorId, UUID jobId);
}
