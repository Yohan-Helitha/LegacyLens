package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.WorkSubmissionDetailResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkMaterialRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkProgressRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;

/** What a reviewer is allowed to see of a submission, and how its review state is named. */
@ExtendWith(MockitoExtension.class)
class WorkReviewServiceImplTest {

    @Mock private JobWorkProgressRepository progressRepository;
    @Mock private JobWorkMaterialRepository materialRepository;
    @Mock private OpportunityRepository opportunityRepository;

    private WorkReviewServiceImpl service;
    private User elder;
    private Job job;
    private JobWorkProgress progress;

    @BeforeEach
    void setUp() {
        service = new WorkReviewServiceImpl(progressRepository, materialRepository, opportunityRepository);

        elder = new User();
        elder.setId(UUID.randomUUID());
        elder.setFullName("Elder Silva");
        User creator = new User();
        creator.setId(UUID.randomUUID());
        creator.setFullName("Savindu");

        job = new Job();
        job.setId(UUID.randomUUID());
        job.setTitle("Herbal Remedy Book");
        job.setCreator(creator);
        job.setElder(elder);

        progress = new JobWorkProgress();
        progress.setJob(job);
        progress.setIntroduction("An intro");
        progress.setStory("The story");
        progress.setSeoKeywords("herbal, remedy");
        progress.setSubmittedAt(LocalDateTime.now());
        progress.setAdminFeedback("Admin wants a clearer photo");
        progress.setElderFeedback("Elder wants a fix");

        lenient().when(progressRepository.findByJobId(job.getId())).thenReturn(Optional.of(progress));
        lenient().when(materialRepository.findByJobIdOrderByUploadedAtAsc(job.getId())).thenReturn(List.of());
    }

    @Test
    void theKnowledgeHolderReadsTheContentButNeverTheAdminsNote() {
        WorkSubmissionDetailResponse detail = service.viewForElder(elder.getId(), job.getId());

        assertThat(detail.getIntroduction()).isEqualTo("An intro");
        assertThat(detail.getSeoKeywords()).containsExactly("herbal", "remedy");
        assertThat(detail.getElderFeedback()).isEqualTo("Elder wants a fix");
        assertThat(detail.getAdminFeedback()).isNull();
    }

    @Test
    void theSummaryNamesTheOpportunityAndTheCreatorSoTheKnowledgeHolderCanMessageThem() {
        UUID opportunityId = UUID.randomUUID();
        job.setOpportunityId(opportunityId);

        var summary = service.viewForElder(elder.getId(), job.getId()).getSummary();

        assertThat(summary.getOpportunityId()).isEqualTo(opportunityId);
        assertThat(summary.getCreatorId()).isEqualTo(job.getCreator().getId());
    }

    @Test
    void theAdminReadsBothNotes() {
        assertThat(service.viewForAdmin(job.getId()).getAdminFeedback()).isEqualTo("Admin wants a clearer photo");
    }

    @Test
    void anotherKnowledgeHoldersJobIsNotFound() {
        assertThatThrownBy(() -> service.viewForElder(UUID.randomUUID(), job.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void aDraftIsStillTheCreatorsOwnAndIsNotFound() {
        progress.setDraft(true);

        assertThatThrownBy(() -> service.viewForAdmin(job.getId())).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void theReviewStateFollowsWhatHasHappenedToTheWork() {
        assertThat(WorkReviewServiceImpl.stateOf(job, progress)).isEqualTo("AWAITING_REVIEW");

        progress.setRejected(true);
        assertThat(WorkReviewServiceImpl.stateOf(job, progress)).isEqualTo("CHANGES_REQUESTED");

        job.setStatus(JobStatus.COMPLETED);
        assertThat(WorkReviewServiceImpl.stateOf(job, progress)).isEqualTo("COMPLETED");

        progress.setPublishedAt(LocalDateTime.now());
        assertThat(WorkReviewServiceImpl.stateOf(job, progress)).isEqualTo("PUBLISHED");
    }
}
