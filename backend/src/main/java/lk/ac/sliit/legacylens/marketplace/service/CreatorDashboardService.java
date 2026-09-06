package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.CreatorDashboardSummaryResponse;
import lk.ac.sliit.legacylens.marketplace.dto.JobResponse;
import lk.ac.sliit.legacylens.marketplace.dto.PaymentHistoryItemResponse;
import lk.ac.sliit.legacylens.marketplace.dto.ReviewResponse;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface CreatorDashboardService {

    /** Rating, completed-jobs count, contributions count, and today's collected total. */
    CreatorDashboardSummaryResponse getSummary(UUID creatorId);

    /** Jobs for one of the dashboard's Active/Upcoming/Completed tabs. */
    List<JobResponse> getJobs(UUID creatorId, JobStatus status);

    /** Most recently completed jobs, newest first. */
    List<JobResponse> getRecentWork(UUID creatorId, int limit);

    /** This creator's reviews only, newest first. */
    List<ReviewResponse> getReviews(UUID creatorId, int limit);

    /** Completed jobs and manually-logged payments merged into one ledger, newest first. */
    List<PaymentHistoryItemResponse> getPaymentHistory(UUID creatorId, int limit);

    /**
     * Logs a cash payment the creator collected, with a photo proof of
     * collection. jobId is optional — a payment doesn't have to be tied to a
     * specific opportunity — but when given, it must belong to this creator.
     */
    PaymentHistoryItemResponse addPayment(
            UUID creatorId, UUID jobId, BigDecimal amount, BigDecimal tipAmount, MultipartFile proofDocument);
}
