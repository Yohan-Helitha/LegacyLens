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

    /** The knowledge holder is happy with the work. Their own earlier note, if any, is withdrawn. */
    WorkFeedbackResponse approveAsElder(UUID elderId, UUID jobId);

    /** The admin is happy with the work. Their own earlier note, if any, is withdrawn. */
    WorkFeedbackResponse approveAsAdmin(UUID jobId);

    /** The admin publishes work both reviewers have approved. */
    WorkFeedbackResponse publish(UUID jobId);

    /**
     * Publishes every piece of approved work that is not in the users' feed yet - work approved before publishing
     * was automatic. Safe to run any number of times. Returns how many were published.
     */
    int publishBacklog();
}
