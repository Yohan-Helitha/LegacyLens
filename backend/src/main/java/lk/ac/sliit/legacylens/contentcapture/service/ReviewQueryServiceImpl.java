package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.common.dto.PagedResponse;
import lk.ac.sliit.legacylens.contentcapture.dto.RatingSummaryDto;
import lk.ac.sliit.legacylens.contentcapture.dto.ReviewResponseDto;
import lk.ac.sliit.legacylens.contentcapture.entity.ElderRating;
import lk.ac.sliit.legacylens.contentcapture.repository.ElderRatingRepository;
import lk.ac.sliit.legacylens.users.entity.KnowledgeHolderProfile;
import lk.ac.sliit.legacylens.users.repository.KnowledgeHolderProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class ReviewQueryServiceImpl implements ReviewQueryService {

    private final ElderRatingRepository elderRatingRepository;
    private final KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;

    public ReviewQueryServiceImpl(
            ElderRatingRepository elderRatingRepository,
            KnowledgeHolderProfileRepository knowledgeHolderProfileRepository) {

        this.elderRatingRepository = elderRatingRepository;
        this.knowledgeHolderProfileRepository = knowledgeHolderProfileRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponseDto> getReviews(UUID elderId, Pageable pageable) {
        Page<ElderRating> page = elderRatingRepository.findByElderIdOrderByCreatedAtDesc(elderId, pageable);

        return PagedResponse.from(page.map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public RatingSummaryDto getSummary(UUID elderId) {
        // Reads the denormalized columns on KnowledgeHolderProfile (kept in
        // sync by RatingService.submitRating) rather than re-aggregating
        // ElderRating here — that's the whole point of denormalizing them.
        KnowledgeHolderProfile profile = knowledgeHolderProfileRepository.findByUserId(elderId).orElse(null);

        BigDecimal average = profile != null ? profile.getAverageRating() : null;
        int count = profile != null ? profile.getRatingCount() : 0;

        return RatingSummaryDto.builder()
                .averageRating(average)
                .ratingCount(count)
                .build();
    }

    private ReviewResponseDto toResponse(ElderRating rating) {
        return ReviewResponseDto.builder()
                .reviewerName(rating.getRatedBy().getFullName())
                .reviewerAvatarUrl(rating.getRatedBy().getProfilePhotoUrl())
                .score(rating.getScore())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .build();
    }
}
