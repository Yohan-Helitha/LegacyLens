package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.marketplace.dto.ChecklistItemResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkMaterialResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkProgressResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkMaterial;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityChecklistItem;
import lk.ac.sliit.legacylens.marketplace.entity.WorkChecklistProgress;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkMaterialRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkProgressRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityChecklistItemRepository;
import lk.ac.sliit.legacylens.marketplace.repository.WorkChecklistProgressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class JobWorkProgressServiceImpl implements JobWorkProgressService {

    /** Subdirectory (under app.upload.dir) that work materials — photos, video clips, audio recordings — are stored in. */
    private static final String WORK_MATERIAL_UPLOAD_SUBDIR = "work-materials";

    private final JobRepository jobRepository;
    private final JobWorkProgressRepository workProgressRepository;
    private final JobWorkMaterialRepository workMaterialRepository;
    private final OpportunityChecklistItemRepository checklistItemRepository;
    private final WorkChecklistProgressRepository checklistProgressRepository;
    private final FileStorageService fileStorageService;

    public JobWorkProgressServiceImpl(
            JobRepository jobRepository,
            JobWorkProgressRepository workProgressRepository,
            JobWorkMaterialRepository workMaterialRepository,
            OpportunityChecklistItemRepository checklistItemRepository,
            WorkChecklistProgressRepository checklistProgressRepository,
            FileStorageService fileStorageService) {

        this.jobRepository = jobRepository;
        this.workProgressRepository = workProgressRepository;
        this.workMaterialRepository = workMaterialRepository;
        this.checklistItemRepository = checklistItemRepository;
        this.checklistProgressRepository = checklistProgressRepository;
        this.fileStorageService = fileStorageService;
    }

    @Override
    @Transactional
    public WorkProgressResponse getProgress(UUID creatorId, UUID jobId) {
        Job job = getOwnedJob(creatorId, jobId);
        return mapToResponse(getOrCreateProgress(job));
    }

    @Override
    @Transactional
    public WorkProgressResponse updateChecklistItem(
            UUID creatorId, UUID jobId, UUID checklistItemId, boolean completed, String note) {

        Job job = getOwnedJob(creatorId, jobId);
        ensureChecklistProgress(job);

        WorkChecklistProgress progress = checklistProgressRepository
                .findByJobIdAndChecklistItemId(jobId, checklistItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found for this job"));

        progress.setCompleted(completed);
        progress.setCompletedAt(completed ? LocalDateTime.now() : null);
        if (note != null) {
            progress.setNote(note);
        }
        checklistProgressRepository.save(progress);

        return mapToResponse(getOrCreateProgress(job));
    }

    @Override
    @Transactional
    public WorkProgressResponse updateNote(UUID creatorId, UUID jobId, String note) {
        Job job = getOwnedJob(creatorId, jobId);
        JobWorkProgress progress = getOrCreateProgress(job);
        progress.setNote(note);
        return mapToResponse(workProgressRepository.save(progress));
    }

    @Override
    @Transactional
    public WorkProgressResponse addMaterial(UUID creatorId, UUID jobId, MultipartFile file) {
        Job job = getOwnedJob(creatorId, jobId);
        JobWorkProgress progress = getOrCreateProgress(job);

        String fileUrl = fileStorageService.store(file, WORK_MATERIAL_UPLOAD_SUBDIR);

        JobWorkMaterial material = new JobWorkMaterial();
        material.setJob(job);
        material.setFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "material");
        material.setFileUrl(fileUrl);
        workMaterialRepository.save(material);

        return mapToResponse(progress);
    }

    @Override
    @Transactional
    public WorkProgressResponse removeMaterial(UUID creatorId, UUID jobId, UUID materialId) {
        Job job = getOwnedJob(creatorId, jobId);
        JobWorkProgress progress = getOrCreateProgress(job);

        JobWorkMaterial material = workMaterialRepository.findByIdAndJobId(materialId, job.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Material not found"));
        workMaterialRepository.delete(material);

        return mapToResponse(progress);
    }

    @Override
    @Transactional
    public WorkProgressResponse markDraft(UUID creatorId, UUID jobId) {
        Job job = getOwnedJob(creatorId, jobId);
        JobWorkProgress progress = getOrCreateProgress(job);
        progress.setDraft(true);
        return mapToResponse(workProgressRepository.save(progress));
    }

    @Override
    @Transactional
    public WorkProgressResponse submitDraft(UUID creatorId, UUID jobId) {
        Job job = getOwnedJob(creatorId, jobId);
        JobWorkProgress progress = getOrCreateProgress(job);

        // Submitting no longer force-completes the checklist or the percentage —
        // whatever fraction of tasks is actually checked off is what gets sent
        // for review. The frontend warns the creator first if items remain.
        progress.setDraft(false);
        if (progress.getSubmittedAt() == null) {
            progress.setSubmittedAt(LocalDateTime.now());
        }

        return mapToResponse(workProgressRepository.save(progress));
    }

    @Override
    @Transactional
    public void resetProgress(UUID creatorId, UUID jobId) {
        Job job = getOwnedJob(creatorId, jobId);
        workMaterialRepository.deleteByJobId(job.getId());
        checklistProgressRepository.deleteByJobId(job.getId());
        workProgressRepository.findByJobId(job.getId()).ifPresent(workProgressRepository::delete);
    }

    private Job getOwnedJob(UUID creatorId, UUID jobId) {
        return jobRepository.findByIdAndCreatorId(jobId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
    }

    private JobWorkProgress getOrCreateProgress(Job job) {
        return workProgressRepository.findByJobId(job.getId())
                .orElseGet(() -> {
                    JobWorkProgress progress = new JobWorkProgress();
                    progress.setJob(job);
                    return workProgressRepository.save(progress);
                });
    }

    /**
     * Makes sure every current OpportunityChecklistItem for this job's
     * opportunity has a matching WorkChecklistProgress row (created as not
     * completed). Called on every read/write, so it doubles as both "copy the
     * opportunity's checklist onto a newly confirmed booking" and "pick up an
     * item the elder added after the booking already existed" — one lazy
     * mechanism instead of two.
     *
     * Jobs that didn't come from a real booking (e.g. directly seeded rows
     * with no opportunityId) simply end up with an empty checklist, which the
     * UI shows as "No tasks added yet."
     */
    private List<WorkChecklistProgress> ensureChecklistProgress(Job job) {
        if (job.getOpportunityId() != null) {
            List<OpportunityChecklistItem> items =
                    checklistItemRepository.findByOpportunityIdOrderBySortOrderAsc(job.getOpportunityId());

            for (OpportunityChecklistItem item : items) {
                if (!checklistProgressRepository.existsByJobIdAndChecklistItemId(job.getId(), item.getId())) {
                    WorkChecklistProgress progress = new WorkChecklistProgress();
                    progress.setJob(job);
                    progress.setChecklistItem(item);
                    checklistProgressRepository.save(progress);
                }
            }
        }

        return checklistProgressRepository.findByJobIdOrderByChecklistItem_SortOrderAsc(job.getId());
    }

    private static String stageForPercentage(int percentage) {
        if (percentage >= 100) return "COMPLETED";
        if (percentage >= 75) return "SUBMIT";
        if (percentage >= 50) return "EDIT";
        if (percentage >= 25) return "RECORD";
        return "PREP";
    }

    private WorkProgressResponse mapToResponse(JobWorkProgress progress) {
        Job job = progress.getJob();

        List<WorkChecklistProgress> checklist = ensureChecklistProgress(job);
        int total = checklist.size();
        long completedCount = checklist.stream().filter(WorkChecklistProgress::isCompleted).count();
        int percentage = total == 0 ? 0 : (int) Math.round((completedCount * 100.0) / total);

        List<ChecklistItemResponse> checklistItems = checklist.stream()
                .map(cp -> ChecklistItemResponse.builder()
                        .id(cp.getChecklistItem().getId())
                        .label(cp.getChecklistItem().getLabel())
                        .sortOrder(cp.getChecklistItem().getSortOrder())
                        .completed(cp.isCompleted())
                        .completedAt(cp.getCompletedAt())
                        .note(cp.getNote())
                        .build())
                .collect(Collectors.toList());

        List<WorkMaterialResponse> materials = workMaterialRepository
                .findByJobIdOrderByUploadedAtAsc(job.getId()).stream()
                .map(m -> WorkMaterialResponse.builder()
                        .id(m.getId())
                        .fileName(m.getFileName())
                        .fileUrl(m.getFileUrl())
                        .uploadedAt(m.getUploadedAt())
                        .build())
                .collect(Collectors.toList());

        return WorkProgressResponse.builder()
                .jobId(job.getId())
                .progressPercentage(percentage)
                .currentStage(stageForPercentage(percentage))
                .note(progress.getNote())
                .draft(progress.isDraft())
                .submittedAt(progress.getSubmittedAt())
                .materials(materials)
                .checklistItems(checklistItems)
                .build();
    }
}
