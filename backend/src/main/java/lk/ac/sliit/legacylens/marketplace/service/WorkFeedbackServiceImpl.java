package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.WorkFeedbackResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;
import lk.ac.sliit.legacylens.marketplace.event.WorkFeedbackGivenEvent;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
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
    private final ApplicationEventPublisher events;

    public WorkFeedbackServiceImpl(
            JobRepository jobRepository, JobWorkProgressRepository progressRepository, ApplicationEventPublisher events) {
        this.jobRepository = jobRepository;
        this.progressRepository = progressRepository;
        this.events = events;
    }

    @Override
    @Transactional
    public WorkFeedbackResponse leaveElderFeedback(UUID elderId, UUID jobId, String message) {
        Job job = ownedByElder(elderId, jobId);
        JobWorkProgress progress = submittedProgress(jobId);

        progress.setElderFeedback(message.trim());
        progress.setElderFeedbackAt(LocalDateTime.now());
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
                .build();
    }
}
