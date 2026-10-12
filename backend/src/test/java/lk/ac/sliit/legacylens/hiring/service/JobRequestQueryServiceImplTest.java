package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestResponse;
import lk.ac.sliit.legacylens.hiring.dto.JobRequestSummaryDto;
import lk.ac.sliit.legacylens.hiring.entity.InputMode;
import lk.ac.sliit.legacylens.hiring.entity.JobRequest;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
                UUID.randomUUID(), "Film my pottery", JobRequestStatus.PUBLISHED, 2L, LocalDateTime.now(), null);
        when(jobRequestRepository.findSummariesByElderId(ELDER_ID, JobRequestStatus.PUBLISHED))
                .thenReturn(List.of(summary));

        List<JobRequestSummaryDto> results = service.getMyRequests(ELDER_ID, JobRequestStatus.PUBLISHED);

        assertThat(results).containsExactly(summary);
    }

    @Test
    void getById_ownedRequest_returnsItsFullDetail() {
        UUID jobRequestId = UUID.randomUUID();
        User elder = new User();
        elder.setId(ELDER_ID);

        JobRequest jobRequest = new JobRequest();
        jobRequest.setId(jobRequestId);
        jobRequest.setElder(elder);
        jobRequest.setTitle("Film my pottery");
        jobRequest.setDescription(null);
        jobRequest.setInputMode(InputMode.VOICE);
        jobRequest.setVoiceNoteUrl("https://project.supabase.co/storage/v1/object/public/story-media/job-requests/x.m4a");
        jobRequest.setStatus(JobRequestStatus.PENDING_ADMIN_REVIEW);

        when(jobRequestRepository.findByIdAndElderId(jobRequestId, ELDER_ID)).thenReturn(Optional.of(jobRequest));

        JobRequestResponse response = service.getById(ELDER_ID, jobRequestId);

        assertThat(response.getId()).isEqualTo(jobRequestId);
        assertThat(response.getTitle()).isEqualTo("Film my pottery");
        assertThat(response.getVoiceNoteUrl()).isEqualTo(jobRequest.getVoiceNoteUrl());
        assertThat(response.getStatus()).isEqualTo("PENDING_ADMIN_REVIEW");
    }

    @Test
    void getById_notOwnedOrMissing_throwsNotFound() {
        UUID jobRequestId = UUID.randomUUID();
        when(jobRequestRepository.findByIdAndElderId(jobRequestId, ELDER_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getById(ELDER_ID, jobRequestId));
    }
}
