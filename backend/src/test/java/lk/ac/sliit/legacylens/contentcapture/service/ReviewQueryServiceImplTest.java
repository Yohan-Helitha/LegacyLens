package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.common.dto.PagedResponse;
import lk.ac.sliit.legacylens.contentcapture.dto.RatingSummaryDto;
import lk.ac.sliit.legacylens.contentcapture.dto.ReviewResponseDto;
import lk.ac.sliit.legacylens.contentcapture.entity.ElderRating;
import lk.ac.sliit.legacylens.contentcapture.repository.ElderRatingRepository;
import lk.ac.sliit.legacylens.users.entity.KnowledgeHolderProfile;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.KnowledgeHolderProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewQueryServiceImplTest {

    private static final UUID ELDER_ID = UUID.randomUUID();

    @Mock
    private ElderRatingRepository elderRatingRepository;

    @Mock
    private KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;

    private ReviewQueryServiceImpl reviewQueryService;

    @BeforeEach
    void setUp() {
        reviewQueryService = new ReviewQueryServiceImpl(elderRatingRepository, knowledgeHolderProfileRepository);
    }

    private ElderRating buildRating() {
        User reviewer = new User();
        reviewer.setFullName("Nadeesha Silva");
        reviewer.setProfilePhotoUrl("/uploads/avatars/nadeesha.jpg");

        ElderRating rating = new ElderRating();
        rating.setRatedBy(reviewer);
        rating.setScore(5);
        rating.setComment("Wonderful stories");
        return rating;
    }

    @Test
    void getReviews_returnsReviewerNameAndAvatar_notJustScore() {
        Pageable pageable = PageRequest.of(0, 20);
        when(elderRatingRepository.findByElderIdOrderByCreatedAtDesc(ELDER_ID, pageable))
                .thenReturn(new PageImpl<>(List.of(buildRating())));

        PagedResponse<ReviewResponseDto> result = reviewQueryService.getReviews(ELDER_ID, pageable);

        ReviewResponseDto dto = result.getContent().get(0);
        assertThat(dto.getReviewerName()).isEqualTo("Nadeesha Silva");
        assertThat(dto.getReviewerAvatarUrl()).isEqualTo("/uploads/avatars/nadeesha.jpg");
        assertThat(dto.getScore()).isEqualTo(5);
        assertThat(dto.getComment()).isEqualTo("Wonderful stories");
    }

    @Test
    void getReviews_forwardsPageableToRepository() {
        Pageable pageable = PageRequest.of(2, 5);
        when(elderRatingRepository.findByElderIdOrderByCreatedAtDesc(ELDER_ID, pageable))
                .thenReturn(new PageImpl<>(List.of()));

        PagedResponse<ReviewResponseDto> result = reviewQueryService.getReviews(ELDER_ID, pageable);

        assertThat(result.getPage()).isZero(); // empty PageImpl built without page metadata defaults to 0
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void getSummary_noProfile_returnsZeroCountAndNullAverage() {
        when(knowledgeHolderProfileRepository.findByUserId(ELDER_ID)).thenReturn(Optional.empty());

        RatingSummaryDto summary = reviewQueryService.getSummary(ELDER_ID);

        assertThat(summary.getAverageRating()).isNull();
        assertThat(summary.getRatingCount()).isZero();
    }

    @Test
    void getSummary_readsFromDenormalizedProfileFields() {
        KnowledgeHolderProfile profile = new KnowledgeHolderProfile();
        profile.setAverageRating(new BigDecimal("4.25"));
        profile.setRatingCount(8);
        when(knowledgeHolderProfileRepository.findByUserId(ELDER_ID)).thenReturn(Optional.of(profile));

        RatingSummaryDto summary = reviewQueryService.getSummary(ELDER_ID);

        assertThat(summary.getAverageRating()).isEqualByComparingTo(new BigDecimal("4.25"));
        assertThat(summary.getRatingCount()).isEqualTo(8);
    }
}
