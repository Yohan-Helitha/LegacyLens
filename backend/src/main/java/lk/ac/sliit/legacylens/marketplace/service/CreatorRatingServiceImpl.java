package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorReviewResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.entity.Review;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.ReviewRepository;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
public class CreatorRatingServiceImpl implements CreatorRatingService {

    private final JobRepository jobRepository;
    private final ReviewRepository reviewRepository;
    private final CreatorProfileRepository creatorProfileRepository;

    public CreatorRatingServiceImpl(
            JobRepository jobRepository, ReviewRepository reviewRepository, CreatorProfileRepository creatorProfileRepository) {
        this.jobRepository = jobRepository;
        this.reviewRepository = reviewRepository;
        this.creatorProfileRepository = creatorProfileRepository;
    }

    @Override
    @Transactional
    public CreatorReviewResponse rateCreator(UUID elderId, UUID jobId, int rating, String comment) {
        if (rating < 1 || rating > 5) {
            throw new InvalidRequestException("The rating must be between 1 and 5");
        }
        Job job = ownedByElder(elderId, jobId);
        if (job.getStatus() != JobStatus.COMPLETED) {
            throw new InvalidApplicationStateException("You can rate the creator once the work is completed.");
        }
        CreatorProfile profile = creatorProfileRepository.findByUserId(job.getCreator().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Creator profile not found"));

        Review review = reviewRepository.findByJobId(jobId).orElseGet(() -> {
            Review fresh = new Review();
            fresh.setJob(job);
            fresh.setCreator(job.getCreator());
            fresh.setElder(job.getElder());
            return fresh;
        });
        review.setRating(rating);
        review.setComment(comment == null || comment.isBlank() ? null : comment.trim());
        reviewRepository.saveAndFlush(review);

        recalculateRating(job.getCreator().getId(), profile);
        return toResponse(review, profile);
    }

    @Override
    @Transactional(readOnly = true)
    public CreatorReviewResponse myReview(UUID elderId, UUID jobId) {
        Job job = ownedByElder(elderId, jobId);
        CreatorProfile profile = creatorProfileRepository.findByUserId(job.getCreator().getId()).orElse(null);
        return reviewRepository.findByJobId(jobId).map(review -> toResponse(review, profile)).orElse(null);
    }

    /** The creator's rating is always the plain average of every review they have; no reviews means no rating. */
    private void recalculateRating(UUID creatorId, CreatorProfile profile) {
        Double average = reviewRepository.calculateAverageRating(creatorId);
        profile.setRating(average == null ? null : BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP));
        profile.setRatingCount((int) reviewRepository.countByCreatorId(creatorId));
        creatorProfileRepository.save(profile);
    }

    private Job ownedByElder(UUID elderId, UUID jobId) {
        return jobRepository.findById(jobId)
                .filter(job -> job.getElder() != null && job.getElder().getId().equals(elderId))
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
    }

    private static CreatorReviewResponse toResponse(Review review, CreatorProfile profile) {
        return CreatorReviewResponse.builder()
                .jobId(review.getJob().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .creatorRating(profile == null ? null : profile.getRating())
                .creatorRatingCount(profile == null ? 0 : profile.getRatingCount())
                .build();
    }
}
