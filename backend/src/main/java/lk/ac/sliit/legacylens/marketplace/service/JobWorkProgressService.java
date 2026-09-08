package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.WorkProgressResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/** Backs MyWorkList's progress display and ContinueMyWorkPage's workspace actions — see JobWorkProgress's javadoc. */
public interface JobWorkProgressService {

    WorkProgressResponse getProgress(UUID creatorId, UUID jobId);

    /** Moves one step forward (Prep -> Record -> Edit -> Submit), capped at TOTAL_STEPS. */
    WorkProgressResponse advance(UUID creatorId, UUID jobId);

    WorkProgressResponse updateNote(UUID creatorId, UUID jobId, String note);

    WorkProgressResponse addMaterial(UUID creatorId, UUID jobId, MultipartFile file);

    WorkProgressResponse removeMaterial(UUID creatorId, UUID jobId, UUID materialId);

    /** "Save As a Draft" — flags the current progress as an explicit draft. */
    WorkProgressResponse markDraft(UUID creatorId, UUID jobId);

    /** Finalises a draft for review: forces completedSteps to TOTAL_STEPS and clears the draft flag. */
    WorkProgressResponse submitDraft(UUID creatorId, UUID jobId);

    /** Discards all progress, materials and notes for a job — "Delete" on a saved draft. */
    void resetProgress(UUID creatorId, UUID jobId);
}
