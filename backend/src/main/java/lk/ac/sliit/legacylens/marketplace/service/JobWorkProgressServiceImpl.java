package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.marketplace.dto.WorkMaterialResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkProgressResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkMaterial;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkMaterialRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkProgressRepository;
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
    private final FileStorageService fileStorageService;

    public JobWorkProgressServiceImpl(
            JobRepository jobRepository,
            JobWorkProgressRepository workProgressRepository,
            JobWorkMaterialRepository workMaterialRepository,
            FileStorageService fileStorageService) {

        this.jobRepository = jobRepository;
        this.workProgressRepository = workProgressRepository;
        this.workMaterialRepository = workMaterialRepository;
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
    public WorkProgressResponse advance(UUID creatorId, UUID jobId) {
        Job job = getOwnedJob(creatorId, jobId);
        JobWorkProgress progress = getOrCreateProgress(job);

        int next = Math.min(progress.getCompletedSteps() + 1, JobWorkProgress.TOTAL_STEPS);
        progress.setCompletedSteps(next);
        if (next >= JobWorkProgress.TOTAL_STEPS && progress.getSubmittedAt() == null) {
            progress.setSubmittedAt(LocalDateTime.now());
        }

        return mapToResponse(workProgressRepository.save(progress));
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

        progress.setCompletedSteps(JobWorkProgress.TOTAL_STEPS);
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

    private WorkProgressResponse mapToResponse(JobWorkProgress progress) {
        List<WorkMaterialResponse> materials = workMaterialRepository
                .findByJobIdOrderByUploadedAtAsc(progress.getJob().getId()).stream()
                .map(m -> WorkMaterialResponse.builder()
                        .id(m.getId())
                        .fileName(m.getFileName())
                        .fileUrl(m.getFileUrl())
                        .uploadedAt(m.getUploadedAt())
                        .build())
                .collect(Collectors.toList());

        return WorkProgressResponse.builder()
                .jobId(progress.getJob().getId())
                .completedSteps(progress.getCompletedSteps())
                .totalSteps(JobWorkProgress.TOTAL_STEPS)
                .note(progress.getNote())
                .draft(progress.isDraft())
                .submittedAt(progress.getSubmittedAt())
                .materials(materials)
                .build();
    }
}
