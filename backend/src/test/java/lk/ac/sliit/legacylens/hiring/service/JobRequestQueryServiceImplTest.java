package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.hiring.dto.JobRequestSummaryDto;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobRequestQueryServiceImplTest {

    private static final UUID ELDER_ID = UUID.randomUUID();

    @Mock
    private JobRequestRepository jobRequestRepository;

    private JobRequestQueryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new JobRequestQueryServiceImpl(jobRequestRepository);
    }

    @Test
    void getMyRequests_delegatesToRepositoryWithGivenFilters() {
        JobRequestSummaryDto summary = new JobRequestSummaryDto(
                UUID.randomUUID(), "Film my pottery", JobRequestStatus.PUBLISHED, 2L, LocalDateTime.now());
        when(jobRequestRepository.findSummariesByElderId(ELDER_ID, JobRequestStatus.PUBLISHED))
                .thenReturn(List.of(summary));

        List<JobRequestSummaryDto> results = service.getMyRequests(ELDER_ID, JobRequestStatus.PUBLISHED);

        assertThat(results).containsExactly(summary);
    }
}
