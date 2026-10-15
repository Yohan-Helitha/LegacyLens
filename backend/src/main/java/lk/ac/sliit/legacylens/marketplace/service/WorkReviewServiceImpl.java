package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.WorkMaterialResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkSubmissionDetailResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkSubmissionSummaryResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkMaterialRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkProgressRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class WorkReviewServiceImpl implements WorkReviewService {

    public static final String AWAITING_REVIEW = "AWAITING_REVIEW";
    public static final String CHANGES_REQUESTED = "CHANGES_REQUESTED";
    public static final String COMPLETED = "COMPLETED";
    public static final String PUBLISHED = "PUBLISHED";

    private final JobWorkProgressRepository progressRepository;
    private final JobWorkMaterialRepository materialRepository;
    private final OpportunityRepository opportunityRepository;

    public WorkReviewServiceImpl(
            JobWorkProgressRepository progressRepository,
            JobWorkMaterialRepository materialRepository,
            OpportunityRepository opportunityRepository) {
        this.progressRepository = progressRepository;
        this.materialRepository = materialRepository;
        this.opportunityRepository = opportunityRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkSubmissionSummaryResponse> listForElder(UUID elderId) {
        return progressRepository.findByJobElderIdAndSubmittedAtIsNotNullAndDraftFalseOrderBySubmittedAtDesc(elderId)
                .stream().map(this::summary).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WorkSubmissionDetailResponse viewForElder(UUID elderId, UUID jobId) {
        JobWorkProgress progress = submitted(jobId);
        Job job = progress.getJob();
        // Someone else's job is "not found" - it should not even be confirmed to exist.
        if (job.getElder() == null || !job.getElder().getId().equals(elderId)) {
            throw new ResourceNotFoundException("Submission not found");
        }
        return detail(progress, false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkSubmissionSummaryResponse> listForAdmin() {
        return progressRepository.findBySubmittedAtIsNotNullAndDraftFalseOrderBySubmittedAtDesc()
                .stream().map(this::summary).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WorkSubmissionDetailResponse viewForAdmin(UUID jobId) {
        return detail(submitted(jobId), true);
    }

    private JobWorkProgress submitted(UUID jobId) {
        return progressRepository.findByJobId(jobId)
                .filter(p -> p.getSubmittedAt() != null && !p.isDraft())
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));
    }

    private WorkSubmissionSummaryResponse summary(JobWorkProgress progress) {
        Job job = progress.getJob();
        Opportunity opportunity = opportunityOf(job);
        return WorkSubmissionSummaryResponse.builder()
                .jobId(job.getId())
                .title(job.getTitle())
                .creatorId(job.getCreator().getId())
                .opportunityId(job.getOpportunityId())
                .creatorName(job.getCreator().getFullName())
                .elderName(job.getElder() != null ? job.getElder().getFullName() : null)
                .category(opportunity != null ? opportunity.getCategory() : null)
                .submittedAt(progress.getSubmittedAt())
                .state(stateOf(job, progress))
                .elderApproved(progress.isElderApproved())
                .adminApproved(progress.isAdminApproved())
                .publishedAt(progress.getPublishedAt())
                .build();
    }

    private WorkSubmissionDetailResponse detail(JobWorkProgress progress, boolean includeAdminNote) {
        Job job = progress.getJob();
        List<WorkMaterialResponse> materials = materialRepository.findByJobIdOrderByUploadedAtAsc(job.getId()).stream()
                .map(m -> WorkMaterialResponse.builder()
                        .id(m.getId())
                        .fileName(m.getFileName())
                        .fileUrl(m.getFileUrl())
                        .uploadedAt(m.getUploadedAt())
                        .build())
                .toList();
        return WorkSubmissionDetailResponse.builder()
                .summary(summary(progress))
                .brief(job.getDescription())
                .introduction(progress.getIntroduction())
                .story(progress.getStory())
                .seoSummary(progress.getSeoSummary())
                .seoKeywords(keywords(progress.getSeoKeywords()))
                .materials(materials)
                .elderFeedback(progress.getElderFeedback())
                .elderFeedbackAt(progress.getElderFeedbackAt())
                .adminFeedback(includeAdminNote ? progress.getAdminFeedback() : null)
                .adminFeedbackAt(includeAdminNote ? progress.getAdminFeedbackAt() : null)
                .build();
    }

    /** Where the review stands - the same states the creator sees, named for a reviewer. */
    static String stateOf(Job job, JobWorkProgress progress) {
        if (progress.getPublishedAt() != null) {
            return PUBLISHED;
        }
        if (job.getStatus() == JobStatus.COMPLETED) {
            return COMPLETED;
        }
        return progress.isRejected() ? CHANGES_REQUESTED : AWAITING_REVIEW;
    }

    private Opportunity opportunityOf(Job job) {
        return job.getOpportunityId() == null ? null : opportunityRepository.findById(job.getOpportunityId()).orElse(null);
    }

    private static List<String> keywords(String stored) {
        if (stored == null || stored.isBlank()) {
            return List.of();
        }
        return Arrays.stream(stored.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
