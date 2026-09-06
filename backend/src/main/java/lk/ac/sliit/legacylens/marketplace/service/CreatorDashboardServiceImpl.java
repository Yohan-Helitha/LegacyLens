package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorDashboardSummaryResponse;
import lk.ac.sliit.legacylens.marketplace.dto.JobResponse;
import lk.ac.sliit.legacylens.marketplace.dto.PaymentHistoryItemResponse;
import lk.ac.sliit.legacylens.marketplace.dto.ReviewResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.entity.PaymentRecord;
import lk.ac.sliit.legacylens.marketplace.entity.Review;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.PaymentRecordRepository;
import lk.ac.sliit.legacylens.marketplace.repository.ReviewRepository;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Read-only aggregation for CreatorDashboard. Nothing here writes a Job or
 * Review — creation/assignment and the future finished/receipt/paid flow are
 * separate, not-yet-built features (see JobStatus's javadoc).
 */
@Service
public class CreatorDashboardServiceImpl implements CreatorDashboardService {

    /** Generous cap for the tab lists — no pagination UI exists for them yet. */
    private static final int TAB_LIST_MAX = 100;

    private final JobRepository jobRepository;
    private final ReviewRepository reviewRepository;
    private final CreatorProfileRepository creatorProfileRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    /** Subdirectory (under app.upload.dir) that payment proof photos are stored in. */
    private static final String PAYMENT_PROOF_UPLOAD_SUBDIR = "payment-proofs";

    public CreatorDashboardServiceImpl(
            JobRepository jobRepository,
            ReviewRepository reviewRepository,
            CreatorProfileRepository creatorProfileRepository,
            PaymentRecordRepository paymentRecordRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService) {

        this.jobRepository = jobRepository;
        this.reviewRepository = reviewRepository;
        this.creatorProfileRepository = creatorProfileRepository;
        this.paymentRecordRepository = paymentRecordRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @Override
    @Transactional(readOnly = true)
    public CreatorDashboardSummaryResponse getSummary(UUID creatorId) {
        BigDecimal rating = creatorProfileRepository.findByUserId(creatorId)
                .map(CreatorProfile::getRating)
                .orElse(null);

        long completedJobsCount = jobRepository.countByCreatorIdAndStatus(creatorId, JobStatus.COMPLETED);
        long contributionsCount = jobRepository.countDistinctEldersByCreatorIdAndStatus(creatorId, JobStatus.COMPLETED);
        BigDecimal collectedToday = sumCollectedToday(creatorId);

        return CreatorDashboardSummaryResponse.builder()
                .rating(rating)
                .completedJobsCount(completedJobsCount)
                .contributionsCount(contributionsCount)
                .collectedToday(collectedToday)
                .build();
    }

    private BigDecimal sumCollectedToday(UUID creatorId) {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);

        BigDecimal fromJobs = jobRepository.sumOfferedAmountByCreatorIdAndStatusAndCompletedAtBetween(
                creatorId, JobStatus.COMPLETED, start, end);
        BigDecimal fromPayments = paymentRecordRepository.sumByCreatorIdAndCollectedAtBetween(creatorId, start, end);

        return fromJobs.add(fromPayments);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobResponse> getJobs(UUID creatorId, JobStatus status) {
        // Completed work reads newest-first; anything still ahead of the
        // creator reads soonest-first.
        Sort sort = status == JobStatus.COMPLETED
                ? Sort.by(Sort.Direction.DESC, "completedAt")
                : Sort.by(Sort.Direction.ASC, "scheduledAt");

        Pageable pageable = PageRequest.of(0, TAB_LIST_MAX, sort);

        return jobRepository.findByCreatorIdAndStatus(creatorId, status, pageable).stream()
                .map(this::mapJob)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobResponse> getRecentWork(UUID creatorId, int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "completedAt"));

        return jobRepository.findByCreatorIdAndStatus(creatorId, JobStatus.COMPLETED, pageable).stream()
                .map(this::mapJob)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviews(UUID creatorId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);

        return reviewRepository.findByCreatorIdOrderByCreatedAtDesc(creatorId, pageable).stream()
                .map(this::mapReview)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentHistoryItemResponse> getPaymentHistory(UUID creatorId, int limit) {
        List<PaymentHistoryItemResponse> items = new ArrayList<>();

        jobRepository.findByCreatorIdAndStatus(creatorId, JobStatus.COMPLETED, PageRequest.of(0, limit))
                .forEach(job -> items.add(PaymentHistoryItemResponse.builder()
                        .id(job.getId())
                        .jobId(job.getId())
                        .opportunityTitle(job.getTitle())
                        .elderName(job.getElder().getFullName())
                        .amount(job.getOfferedAmount())
                        .tipAmount(BigDecimal.ZERO)
                        .totalAmount(job.getOfferedAmount())
                        .collectedAt(job.getCompletedAt())
                        .note(job.getTitle() + " — " + job.getElder().getFullName())
                        .build()));

        paymentRecordRepository.findByCreatorIdOrderByCollectedAtDesc(creatorId, PageRequest.of(0, limit))
                .forEach(payment -> items.add(mapPaymentRecord(payment)));

        items.sort(Comparator.comparing(PaymentHistoryItemResponse::getCollectedAt).reversed());

        return items.size() > limit ? items.subList(0, limit) : items;
    }

    @Override
    @Transactional
    public PaymentHistoryItemResponse addPayment(
            UUID creatorId, UUID jobId, BigDecimal amount, BigDecimal tipAmount, MultipartFile proofDocument) {

        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Job job = null;
        if (jobId != null) {
            job = jobRepository.findByIdAndCreatorId(jobId, creatorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
        }

        String proofDocumentUrl = fileStorageService.store(proofDocument, PAYMENT_PROOF_UPLOAD_SUBDIR);

        PaymentRecord record = new PaymentRecord();
        record.setCreator(creator);
        record.setJob(job);
        record.setAmount(amount);
        record.setTipAmount(tipAmount != null ? tipAmount : BigDecimal.ZERO);
        record.setProofDocumentUrl(proofDocumentUrl);
        record = paymentRecordRepository.save(record);

        return mapPaymentRecord(record);
    }

    private PaymentHistoryItemResponse mapPaymentRecord(PaymentRecord record) {
        Job job = record.getJob();
        BigDecimal tip = record.getTipAmount() != null ? record.getTipAmount() : BigDecimal.ZERO;

        return PaymentHistoryItemResponse.builder()
                .id(record.getId())
                .jobId(job != null ? job.getId() : null)
                .opportunityTitle(job != null ? job.getTitle() : null)
                .elderName(job != null ? job.getElder().getFullName() : null)
                .amount(record.getAmount())
                .tipAmount(tip)
                .totalAmount(record.getAmount().add(tip))
                .proofDocumentUrl(record.getProofDocumentUrl())
                .collectedAt(record.getCollectedAt())
                .note(record.getNote())
                .build();
    }

    private JobResponse mapJob(Job job) {
        return JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .description(job.getDescription())
                .elderName(job.getElder().getFullName())
                .location(job.getLocation())
                .offeredAmount(job.getOfferedAmount())
                .status(job.getStatus().name())
                .urgent(job.isUrgent())
                .scheduledAt(job.getScheduledAt())
                .completedAt(job.getCompletedAt())
                .build();
    }

    private ReviewResponse mapReview(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .elderName(review.getElder().getFullName())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
