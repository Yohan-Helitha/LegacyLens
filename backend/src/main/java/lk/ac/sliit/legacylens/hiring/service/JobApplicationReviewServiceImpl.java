package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.common.exception.ForbiddenOperationException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.exception.StateTransitionException;
import lk.ac.sliit.legacylens.hiring.entity.JobApplication;
import lk.ac.sliit.legacylens.hiring.entity.JobApplicationStatus;
import lk.ac.sliit.legacylens.hiring.entity.JobRequest;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lk.ac.sliit.legacylens.hiring.repository.JobApplicationRepository;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class JobApplicationReviewServiceImpl implements JobApplicationReviewService {

    private final JobRequestRepository jobRequestRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final JobRequestStateMachine jobRequestStateMachine;
    private final MessagingChannelPort messagingChannelPort;

    public JobApplicationReviewServiceImpl(
            JobRequestRepository jobRequestRepository,
            JobApplicationRepository jobApplicationRepository,
            JobRequestStateMachine jobRequestStateMachine,
            MessagingChannelPort messagingChannelPort) {

        this.jobRequestRepository = jobRequestRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.jobRequestStateMachine = jobRequestStateMachine;
        this.messagingChannelPort = messagingChannelPort;
    }

    @Override
    @Transactional
    public void approve(UUID jobRequestId, UUID applicationId, UUID elderId) {
        JobRequest jobRequest = getOwnedJobRequest(jobRequestId, elderId);

        if (!jobRequestStateMachine.canTransition(jobRequest.getStatus(), JobRequestStatus.CLOSED)) {
            throw new StateTransitionException(
                    "Can't approve an applicant while the job request is " + jobRequest.getStatus());
        }

        JobApplication target = getApplication(jobRequestId, applicationId);
        target.setStatus(JobApplicationStatus.ACCEPTED);
        jobApplicationRepository.save(target);

        // One creator per job: every other still-pending applicant is auto-rejected.
        List<JobApplication> others = jobApplicationRepository
                .findByJobRequestIdAndStatus(jobRequestId, JobApplicationStatus.PENDING);
        for (JobApplication other : others) {
            if (!other.getId().equals(target.getId())) {
                other.setStatus(JobApplicationStatus.REJECTED);
                other.setRejectionReason(null);
            }
        }
        jobApplicationRepository.saveAll(others);

        jobRequest.setStatus(JobRequestStatus.CLOSED);
        jobRequestRepository.save(jobRequest);

        messagingChannelPort.openConversation(elderId, target.getCreator().getId());
    }

    @Override
    @Transactional
    public void reject(UUID jobRequestId, UUID applicationId, UUID elderId, String reason) {
        getOwnedJobRequest(jobRequestId, elderId);

        JobApplication target = getApplication(jobRequestId, applicationId);
        target.setStatus(JobApplicationStatus.REJECTED);
        target.setRejectionReason(reason);
        jobApplicationRepository.save(target);
    }

    private JobRequest getOwnedJobRequest(UUID jobRequestId, UUID elderId) {
        JobRequest jobRequest = jobRequestRepository.findById(jobRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Job request not found"));

        if (!jobRequest.getElder().getId().equals(elderId)) {
            throw new ForbiddenOperationException("You don't own this job request");
        }

        return jobRequest;
    }

    private JobApplication getApplication(UUID jobRequestId, UUID applicationId) {
        return jobApplicationRepository.findByIdAndJobRequestId(applicationId, jobRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
    }
}
