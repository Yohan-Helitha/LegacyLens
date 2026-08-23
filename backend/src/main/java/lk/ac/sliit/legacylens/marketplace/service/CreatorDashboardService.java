package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.CreatorDashboardSummaryResponse;
import lk.ac.sliit.legacylens.marketplace.dto.JobResponse;
import lk.ac.sliit.legacylens.marketplace.dto.ReviewResponse;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;

import java.util.List;
import java.util.UUID;

public interface CreatorDashboardService {

    /** Rating, completed-jobs count, contributions count, and available balance. */
    CreatorDashboardSummaryResponse getSummary(UUID creatorId);

    /** Jobs for one of the dashboard's Active/Upcoming/Completed tabs. */
    List<JobResponse> getJobs(UUID creatorId, JobStatus status);

    /** Most recently completed jobs, newest first. */
    List<JobResponse> getRecentWork(UUID creatorId, int limit);

    /** This creator's reviews only, newest first. */
    List<ReviewResponse> getReviews(UUID creatorId, int limit);
}
