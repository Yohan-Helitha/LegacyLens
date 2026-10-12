package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.marketplace.dto.WorkProgressResponse;
import lk.ac.sliit.legacylens.marketplace.entity.ChecklistStage;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkMaterial;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityChecklistItem;
import lk.ac.sliit.legacylens.marketplace.entity.WorkChecklistProgress;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkMaterialRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkProgressRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityChecklistItemRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.marketplace.repository.WorkChecklistProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;

/**
 * The rules for how a creator's work moves from Prep to Record to Edit to Submit: what can be ticked,
 * what ticks itself, and how the percentage is worked out.
 */
@ExtendWith(MockitoExtension.class)
class JobWorkProgressServiceImplTest {

    @Mock private JobRepository jobRepository;
    @Mock private JobWorkProgressRepository workProgressRepository;
    @Mock private JobWorkMaterialRepository workMaterialRepository;
    @Mock private OpportunityChecklistItemRepository checklistItemRepository;
    @Mock private WorkChecklistProgressRepository checklistProgressRepository;
    @Mock private OpportunityRepository opportunityRepository;
    @Mock private FileStorageService fileStorageService;

    private JobWorkProgressServiceImpl service;
    private final UUID creatorId = UUID.randomUUID();
    private Job job;
    private JobWorkProgress progress;
    private final List<WorkChecklistProgress> checklist = new ArrayList<>();
    private final List<JobWorkMaterial> materials = new ArrayList<>();

    @BeforeEach
    void setUp() {
        service = new JobWorkProgressServiceImpl(jobRepository, workProgressRepository, workMaterialRepository,
                checklistItemRepository, checklistProgressRepository, opportunityRepository, fileStorageService);

        job = new Job();
        job.setId(UUID.randomUUID());
        progress = new JobWorkProgress();
        progress.setJob(job);

        lenient().when(jobRepository.findByIdAndCreatorId(job.getId(), creatorId)).thenReturn(Optional.of(job));
        lenient().when(workProgressRepository.findByJobId(job.getId())).thenReturn(Optional.of(progress));
        lenient().when(workProgressRepository.save(any(JobWorkProgress.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(checklistProgressRepository.save(any(WorkChecklistProgress.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(checklistProgressRepository.findByJobIdOrderByChecklistItem_SortOrderAsc(job.getId()))
                .thenReturn(checklist);
        lenient().when(workMaterialRepository.findByJobIdOrderByUploadedAtAsc(job.getId())).thenReturn(materials);
        lenient().when(checklistProgressRepository.findByJobIdAndChecklistItemId(any(), any())).thenAnswer(inv ->
                checklist.stream().filter(cp -> cp.getChecklistItem().getId().equals(inv.getArgument(1))).findFirst());
    }

    private WorkChecklistProgress task(ChecklistStage stage, boolean completed) {
        OpportunityChecklistItem item = new OpportunityChecklistItem();
        item.setId(UUID.randomUUID());
        item.setLabel(stage + " task");
        item.setSortOrder(checklist.size());
        item.setStage(stage);
        WorkChecklistProgress cp = new WorkChecklistProgress();
        cp.setJob(job);
        cp.setChecklistItem(item);
        cp.setCompleted(completed);
        checklist.add(cp);
        return cp;
    }

    private void writtenContentDone() {
        progress.setIntroduction("Intro");
        progress.setStory("Story");
        progress.setSeoSummary("Summary");
    }

    private WorkProgressResponse read() {
        return service.getProgress(creatorId, job.getId());
    }

    // ── Ticking ─────────────────────────────────────────────────────────────

    @Test
    void aPrepTask_isTickedByHand() {
        WorkChecklistProgress prep = task(ChecklistStage.PREP, false);

        WorkProgressResponse response = service.updateChecklistItem(creatorId, job.getId(), prep.getChecklistItem().getId(), true, null);

        assertThat(prep.isCompleted()).isTrue();
        assertThat(response.isPrepDone()).isTrue();
        assertThat(response.getProgressPercentage()).isEqualTo(25);
    }

    @Test
    void recordEditAndSubmitTasks_haveNothingToTick() {
        for (ChecklistStage stage : List.of(ChecklistStage.RECORD, ChecklistStage.EDIT, ChecklistStage.SUBMIT)) {
            WorkChecklistProgress other = task(stage, false);
            assertThatThrownBy(() -> service.updateChecklistItem(creatorId, job.getId(), other.getChecklistItem().getId(), true, null))
                    .isInstanceOf(InvalidRequestException.class);
        }
        assertThat(read().getChecklistItems()).isEmpty();
    }

    // ── The four steps ──────────────────────────────────────────────────────

    @Test
    void record_isDone_exactlyWhenAMaterialIsUploaded() {
        task(ChecklistStage.PREP, true);
        assertThat(read().isRecordDone()).isFalse();
        assertThat(read().getCurrentStage()).isEqualTo("RECORD");

        materials.add(new JobWorkMaterial());
        assertThat(read().isRecordDone()).isTrue();
        assertThat(read().getCurrentStage()).isEqualTo("EDIT");
    }

    @Test
    void edit_isDone_onlyOnceIntroductionStoryAndSummaryAreAllWritten() {
        progress.setIntroduction("Intro");
        progress.setStory("Story");
        assertThat(read().isEditDone()).isFalse();

        progress.setSeoSummary("Summary");
        assertThat(read().isEditDone()).isTrue();

        progress.setStory("   ");
        assertThat(read().isEditDone()).isFalse();
    }

    @Test
    void prep_isNotDone_whileAnyPrepTaskIsOpen_andAJobWithNoPrepTasksSkipsIt() {
        task(ChecklistStage.PREP, true);
        task(ChecklistStage.PREP, false);
        assertThat(read().isPrepDone()).isFalse();
        assertThat(read().getCurrentStage()).isEqualTo("PREP");

        checklist.clear();
        assertThat(read().isPrepDone()).isTrue();
    }

    @Test
    void erasingOneWrittenBox_unmarksEdit_andTakesAQuarterOff_butKeepsTheOtherBoxes() {
        materials.add(new JobWorkMaterial());
        writtenContentDone();
        task(ChecklistStage.PREP, true);
        assertThat(read().getProgressPercentage()).isEqualTo(75);

        WorkProgressResponse response = service.updateNote(creatorId, job.getId(), "", "Story");

        assertThat(response.isEditDone()).isFalse();
        assertThat(response.getProgressPercentage()).isEqualTo(50);
        assertThat(response.getIntroduction()).isEmpty();
        assertThat(response.getStory()).isEqualTo("Story");
        assertThat(response.getSeoSummary()).isEqualTo("Summary");

        // Writing it again brings the step - and the quarter - back.
        assertThat(service.updateNote(creatorId, job.getId(), "New intro", "Story").getProgressPercentage()).isEqualTo(75);
    }

    @Test
    void aJob_isNew_untilTheCreatorFirstOpensIt_andOnlyTheFirstOpenCounts() {
        assertThat(read().getOpenedAt()).isNull();

        service.markOpened(creatorId, job.getId());
        LocalDateTime first = progress.getOpenedAt();
        assertThat(first).isNotNull();
        assertThat(read().getOpenedAt()).isEqualTo(first);

        service.markOpened(creatorId, job.getId());
        assertThat(progress.getOpenedAt()).isEqualTo(first);
    }

    // ── Percentage: four steps, a quarter each ──────────────────────────────

    @Test
    void prepTasks_shareOneQuarter_howeverManyThereAre() {
        task(ChecklistStage.PREP, true);
        task(ChecklistStage.PREP, true);
        task(ChecklistStage.PREP, false);
        task(ChecklistStage.PREP, false);

        assertThat(read().getProgressPercentage()).isEqualTo(13);
    }

    @Test
    void afterPrepRecordAndEdit_submitIsNext_andProgressIsThreeQuarters() {
        materials.add(new JobWorkMaterial());
        writtenContentDone();
        task(ChecklistStage.PREP, true);

        WorkProgressResponse response = read();

        assertThat(response.getCurrentStage()).isEqualTo("SUBMIT");
        assertThat(response.getProgressPercentage()).isEqualTo(75);
        assertThat(response.isSubmitted()).isFalse();
    }

    @Test
    void savingADraft_doesNotCompleteSubmit() {
        materials.add(new JobWorkMaterial());
        writtenContentDone();
        task(ChecklistStage.PREP, true);
        progress.setSubmittedAt(LocalDateTime.now());
        progress.setDraft(true);

        assertThat(read().getProgressPercentage()).isEqualTo(75);
    }

    @Test
    void submitting_completesTheLastStep_andReachesOneHundredPercent() {
        materials.add(new JobWorkMaterial());
        writtenContentDone();
        task(ChecklistStage.PREP, true);
        progress.setSubmittedAt(LocalDateTime.now());
        progress.setDraft(false);

        WorkProgressResponse response = read();

        assertThat(response.getCurrentStage()).isEqualTo("COMPLETED");
        assertThat(response.getProgressPercentage()).isEqualTo(100);
        assertThat(response.isSubmitted()).isTrue();
    }
}
