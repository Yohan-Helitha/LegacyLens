package lk.ac.sliit.legacylens.marketplace.service;

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

    public CreatorDashboardServiceImpl(
            JobRepository jobRepository,
            ReviewRepository reviewRepository,
            CreatorProfileRepository creatorProfileRepository,
            PaymentRecordRepository paymentRecordRepository,
            UserRepository userRepository) {

        this.jobRepository = jobRepository;
        this.reviewRepository = reviewRepository;
        this.creatorProfileRepository = creatorProfileRepository;
        this.paymentRecordRepository = paymentRecordRepository;
        this.userRepository = userRepository;
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
                        .amount(job.getOfferedAmount())
                        .collectedAt(job.getCompletedAt())
                        .note(job.getTitle() + " — " + job.getElder().getFullName())
                        .build()));

        paymentRecordRepository.findByCreatorIdOrderByCollectedAtDesc(creatorId, PageRequest.of(0, limit))
                .forEach(payment -> items.add(PaymentHistoryItemResponse.builder()
                        .id(payment.getId())
                        .amount(payment.getAmount())
                        .collectedAt(payment.getCollectedAt())
                        .note(payment.getNote())
                        .build()));

        items.sort(Comparator.comparing(PaymentHistoryItemResponse::getCollectedAt).reversed());

        return items.size() > limit ? items.subList(0, limit) : items;
    }

    @Override
    @Transactional
    public PaymentHistoryItemResponse addPayment(UUID creatorId, BigDecimal amount, String note) {
        User creator = userRepository.findById(creatorId).orElseThrow();

        PaymentRecord record = new PaymentRecord();
        record.setCreator(creator);
        record.setAmount(amount);
        record.setNote(note);
        record = paymentRecordRepository.save(record);

        return PaymentHistoryItemResponse.builder()
                .id(record.getId())
                .amount(record.getAmount())
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
