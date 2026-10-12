package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.hiring.dto.JobApplicationSummaryDto;
import lk.ac.sliit.legacylens.hiring.entity.JobApplication;
import lk.ac.sliit.legacylens.hiring.entity.JobRequest;
import lk.ac.sliit.legacylens.hiring.repository.JobApplicationRepository;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobApplicationQueryServiceImplTest {

    private static final UUID ELDER_ID = UUID.randomUUID();
    private static final UUID JOB_REQUEST_ID = UUID.randomUUID();
    private static final UUID CREATOR_ID = UUID.randomUUID();

    @Mock
    private JobRequestRepository jobRequestRepository;

    @Mock
    private JobApplicationRepository jobApplicationRepository;

    @Mock
    private CreatorProfileRepository creatorProfileRepository;

    private JobApplicationQueryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new JobApplicationQueryServiceImpl(jobRequestRepository, jobApplicationRepository, creatorProfileRepository);
    }

    @Test
    void getApplications_returnsSummaryList() {
        JobRequest jobRequest = new JobRequest();
        jobRequest.setId(JOB_REQUEST_ID);
        when(jobRequestRepository.findByIdAndElderId(JOB_REQUEST_ID, ELDER_ID)).thenReturn(Optional.of(jobRequest));

        User creator = new User();
        creator.setId(CREATOR_ID);
        creator.setFullName("Nadeesha Silva");

        JobApplication application = new JobApplication();
        application.setId(UUID.randomUUID());
        application.setCreator(creator);
        application.setMessage("I'd love to help");

        when(jobApplicationRepository.findByJobRequestIdOrderByAppliedAtDesc(JOB_REQUEST_ID))
                .thenReturn(List.of(application));
        when(creatorProfileRepository.findByUserId(CREATOR_ID)).thenReturn(Optional.empty());

        List<JobApplicationSummaryDto> results = service.getApplications(JOB_REQUEST_ID, ELDER_ID);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getCreatorName()).isEqualTo("Nadeesha Silva");
        assertThat(results.get(0).getMessage()).isEqualTo("I'd love to help");
    }

    @Test
    void getApplications_jobRequestNotOwned_throwsResourceNotFound() {
        when(jobRequestRepository.findByIdAndElderId(JOB_REQUEST_ID, ELDER_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getApplications(JOB_REQUEST_ID, ELDER_ID));
    }
}
