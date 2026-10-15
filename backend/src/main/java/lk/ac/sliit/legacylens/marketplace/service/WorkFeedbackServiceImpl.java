package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.WorkFeedbackResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.event.WorkApprovedEvent;
import lk.ac.sliit.legacylens.marketplace.event.WorkFeedbackGivenEvent;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkMaterialRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkProgressRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class WorkFeedbackServiceImpl implements WorkFeedbackService {

    private final JobRepository jobRepository;
    private final JobWorkProgressRepository progressRepository;
    private final JobWorkMaterialRepository materialRepository;
    private final CreatorWorkPublisher publisher;
    private final ApplicationEventPublisher events;

    public WorkFeedbackServiceImpl(
            JobRepository jobRepository,
            JobWorkProgressRepository progressRepository,
            JobWorkMaterialRepository materialRepository,
            CreatorWorkPublisher publisher,
            ApplicationEventPublisher events) {
        this.jobRepository = jobRepository;
        this.progressRepository = progressRepository;
        this.materialRepository = materialRepository;
        this.publisher = publisher;
        this.events = events;
    }

    @Override
    @Transactional
    public WorkFeedbackResponse leaveElderFeedback(UUID elderId, UUID jobId, String message) {
        Job job = ownedByElder(elderId, jobId);
        JobWorkProgress progress = submittedProgress(jobId);

        progress.setElderFeedback(message.trim());
        progress.setElderFeedbackAt(LocalDateTime.now());
        progress.setElderApproved(false);
        sendBack(progress);
        events.publishEvent(new WorkFeedbackGivenEvent(job.getCreator().getId(), jobId, job.getTitle(), "knowledge holder"));
        return elderView(progressRepository.save(progress));
    }

    @Override
    @Transactional(readOnly = true)
    public WorkFeedbackResponse elderView(UUID elderId, UUID jobId) {
        ownedByElder(elderId, jobId);
        return elderView(progressRepository.findByJobId(jobId).orElse(new JobWorkProgress()), jobId);
    }

    @Override
    @Transactional
    public WorkFeedbackResponse leaveAdminFeedback(UUID jobId, String message) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        JobWorkProgress progress = submittedProgress(jobId);

        progress.setAdminFeedback(message.trim());
        progress.setAdminFeedbackAt(LocalDateTime.now());
        progress.setAdminApproved(false);
        sendBack(progress);
        events.publishEvent(new WorkFeedbackGivenEvent(job.getCreator().getId(), jobId, job.getTitle(), "admin"));
        return adminView(progressRepository.save(progress));
    }

    @Override
    @Transactional(readOnly = true)
    public WorkFeedbackResponse adminView(UUID jobId) {
        jobRepository.findById(jobId).orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        return adminView(progressRepository.findByJobId(jobId).orElse(new JobWorkProgress()), jobId);
    }

    @Override
    @Transactional
    public WorkFeedbackResponse approveAsElder(UUID elderId, UUID jobId) {
        Job job = ownedByElder(elderId, jobId);
        JobWorkProgress progress = submittedProgress(jobId);
        progress.setElderFeedback(null);
        progress.setElderFeedbackAt(null);
        progress.setElderApproved(true);
        completeWhenBothApproved(job, progress);
        return elderView(progressRepository.save(progress));
    }

    @Override
    @Transactional
    public WorkFeedbackResponse approveAsAdmin(UUID jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        JobWorkProgress progress = submittedProgress(jobId);
        progress.setAdminFeedback(null);
        progress.setAdminFeedbackAt(null);
        progress.setAdminApproved(true);
        completeWhenBothApproved(job, progress);
        return adminView(progressRepository.save(progress));
    }

    @Override
    @Transactional
    public WorkFeedbackResponse publish(UUID jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (job.getStatus() != JobStatus.COMPLETED) {
            throw new InvalidApplicationStateException("Only work both reviewers approved can be published.");
        }
        JobWorkProgress progress = progressRepository.findByJobId(jobId)
                .orElseThrow(() -> new InvalidApplicationStateException("This work has not been submitted yet."));
        // Normally work is published the moment both reviewers approve; this covers work that was approved
        // before that was automatic. Publishing twice does nothing extra.
        publishNow(job, progress);
        return adminView(progressRepository.save(progress));
    }

    /**
     * Puts the work in front of users and tells the creator. Does nothing if it is already published, so the
     * same work can never appear in the feed twice.
     */
    private void publishNow(Job job, JobWorkProgress progress) {
        if (progress.getPublishedAt() != null) {
            return;
        }
        publisher.publish(PublishedWork.from(job, progress, materialRepository.findByJobIdOrderByUploadedAtAsc(job.getId())));
        progress.setPublishedAt(LocalDateTime.now());
        events.publishEvent(new WorkApprovedEvent(job.getCreator().getId(), job.getId(), job.getTitle(), true));
    }

    /**
     * Once both reviewers have approved and neither note is outstanding the work is complete: the job
     * becomes COMPLETED (so it moves to the creator's Completed tab) and it is published to users straight
     * away, with the creator told it is live. A note still outstanding keeps it on the creator's Rejected
     * Submissions page.
     */
    private void completeWhenBothApproved(Job job, JobWorkProgress progress) {
        boolean noteOutstanding = progress.getElderFeedback() != null || progress.getAdminFeedback() != null;
        progress.setRejected(noteOutstanding);
        if (!noteOutstanding) {
            progress.setRejectedAt(null);
        }
        if (progress.isElderApproved() && progress.isAdminApproved() && !noteOutstanding
                && job.getStatus() != JobStatus.COMPLETED) {
            job.setStatus(JobStatus.COMPLETED);
            job.setCompletedAt(LocalDateTime.now());
            jobRepository.save(job);
            // One notification, "published", rather than "approved" followed straight away by "published".
            publishNow(job, progress);
        }
    }

    /** Only a submission that was actually sent for review can be sent back. */
    private JobWorkProgress submittedProgress(UUID jobId) {
        JobWorkProgress progress = progressRepository.findByJobId(jobId)
                .orElseThrow(() -> new InvalidApplicationStateException("This work has not been submitted yet."));
        if (progress.getSubmittedAt() == null || progress.isDraft()) {
            throw new InvalidApplicationStateException("This work has not been submitted yet.");
        }
        return progress;
    }

    /** A note puts the submission on the creator's Rejected Submissions page until they resubmit. */
    private static void sendBack(JobWorkProgress progress) {
        progress.setRejected(true);
        progress.setRejectionSeenAt(null);
        if (progress.getRejectedAt() == null) {
            progress.setRejectedAt(LocalDateTime.now());
        }
    }

    /** The job, provided it is the signed-in knowledge holder's own - anyone else gets "not found". */
    private Job ownedByElder(UUID elderId, UUID jobId) {
        return jobRepository.findById(jobId)
                .filter(job -> job.getElder() != null && job.getElder().getId().equals(elderId))
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
    }

    private static WorkFeedbackResponse elderView(JobWorkProgress progress) {
        return elderView(progress, progress.getJob().getId());
    }

    private static WorkFeedbackResponse elderView(JobWorkProgress progress, UUID jobId) {
        return WorkFeedbackResponse.builder()
                .jobId(jobId)
                .elderFeedback(progress.getElderFeedback())
                .elderFeedbackAt(progress.getElderFeedbackAt())
                .elderApproved(progress.isElderApproved())
                .publishedAt(progress.getPublishedAt())
                .build();
    }

    private static WorkFeedbackResponse adminView(JobWorkProgress progress) {
        return adminView(progress, progress.getJob().getId());
    }

    private static WorkFeedbackResponse adminView(JobWorkProgress progress, UUID jobId) {
        return WorkFeedbackResponse.builder()
                .jobId(jobId)
                .elderFeedback(progress.getElderFeedback())
                .elderFeedbackAt(progress.getElderFeedbackAt())
                .adminFeedback(progress.getAdminFeedback())
                .adminFeedbackAt(progress.getAdminFeedbackAt())
                .elderApproved(progress.isElderApproved())
                .adminApproved(progress.isAdminApproved())
                .publishedAt(progress.getPublishedAt())
                .build();
    }
}
