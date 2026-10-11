package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.WorkFeedbackResponse;

import java.util.UUID;

/**
 * Reviewers' notes on a creator's submitted work. The creator reads both through their work
 * progress; the knowledge holder writes and reads only their own note; the admin writes their note
 * and reads both - that is how an admin finds out what the knowledge holder asked for.
 */
public interface WorkFeedbackService {

    /** The knowledge holder the job is for sends it back with changes. */
    WorkFeedbackResponse leaveElderFeedback(UUID elderId, UUID jobId, String message);

    /** What the knowledge holder wrote, without the admin's note. */
    WorkFeedbackResponse elderView(UUID elderId, UUID jobId);

    /** The admin sends it back with changes. */
    WorkFeedbackResponse leaveAdminFeedback(UUID jobId, String message);

    /** Both notes. */
    WorkFeedbackResponse adminView(UUID jobId);
}
