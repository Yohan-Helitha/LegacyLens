package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.hiring.dto.JobApplicationSummaryDto;
import lk.ac.sliit.legacylens.hiring.entity.JobApplication;
import lk.ac.sliit.legacylens.hiring.repository.JobApplicationRepository;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class JobApplicationQueryServiceImpl implements JobApplicationQueryService {

    private final JobRequestRepository jobRequestRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final CreatorProfileRepository creatorProfileRepository;

    public JobApplicationQueryServiceImpl(
            JobRequestRepository jobRequestRepository,
            JobApplicationRepository jobApplicationRepository,
            CreatorProfileRepository creatorProfileRepository) {

        this.jobRequestRepository = jobRequestRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.creatorProfileRepository = creatorProfileRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobApplicationSummaryDto> getApplications(UUID jobRequestId, UUID elderId) {
        jobRequestRepository.findByIdAndElderId(jobRequestId, elderId)
                .orElseThrow(() -> new ResourceNotFoundException("Job request not found"));

        return jobApplicationRepository.findByJobRequestIdOrderByAppliedAtDesc(jobRequestId).stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    private JobApplicationSummaryDto toSummary(JobApplication application) {
        BigDecimal rating = creatorProfileRepository.findByUserId(application.getCreator().getId())
                .map(profile -> profile.getRating())
                .orElse(null);

        return JobApplicationSummaryDto.builder()
                .id(application.getId())
                .creatorId(application.getCreator().getId())
                .creatorName(application.getCreator().getFullName())
                .creatorRating(rating)
                .message(application.getMessage())
                .status(application.getStatus().name())
                .appliedAt(application.getAppliedAt())
                .build();
    }
}
