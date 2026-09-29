package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.hiring.dto.JobRequestSummaryDto;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class JobRequestQueryServiceImpl implements JobRequestQueryService {

    private final JobRequestRepository jobRequestRepository;

    public JobRequestQueryServiceImpl(JobRequestRepository jobRequestRepository) {
        this.jobRequestRepository = jobRequestRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobRequestSummaryDto> getMyRequests(UUID elderId, JobRequestStatus statusFilter) {
        return jobRequestRepository.findSummariesByElderId(elderId, statusFilter);
    }
}
