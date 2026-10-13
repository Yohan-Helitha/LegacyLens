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
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreatorRatingServiceImplTest {

    @Mock private JobRepository jobRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private CreatorProfileRepository creatorProfileRepository;

    private CreatorRatingServiceImpl service;
    private User elder;
    private User creator;
    private Job job;
    private CreatorProfile profile;

    @BeforeEach
    void setUp() {
        service = new CreatorRatingServiceImpl(jobRepository, reviewRepository, creatorProfileRepository);

        elder = new User();
        elder.setId(UUID.randomUUID());
        creator = new User();
        creator.setId(UUID.randomUUID());
        job = new Job();
        job.setId(UUID.randomUUID());
        job.setElder(elder);
        job.setCreator(creator);
        job.setStatus(JobStatus.COMPLETED);
        profile = new CreatorProfile();
        profile.setUser(creator);

        lenient().when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
        lenient().when(creatorProfileRepository.findByUserId(creator.getId())).thenReturn(Optional.of(profile));
        lenient().when(reviewRepository.findByJobId(job.getId())).thenReturn(Optional.empty());
    }

    @Test
    void firstReviewBecomesTheCreatorsRating() {
        when(reviewRepository.calculateAverageRating(creator.getId())).thenReturn(4.0);
        when(reviewRepository.countByCreatorId(creator.getId())).thenReturn(1L);

        CreatorReviewResponse response = service.rateCreator(elder.getId(), job.getId(), 4, "  Lovely work  ");

        ArgumentCaptor<Review> saved = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepository).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getRating()).isEqualTo(4);
        assertThat(saved.getValue().getComment()).isEqualTo("Lovely work");
        assertThat(saved.getValue().getCreator()).isSameAs(creator);
        assertThat(saved.getValue().getElder()).isSameAs(elder);
        assertThat(profile.getRating()).isEqualByComparingTo("4.00");
        assertThat(profile.getRatingCount()).isEqualTo(1);
        assertThat(response.getCreatorRating()).isEqualByComparingTo("4.00");
    }

    @Test
    void ratingIsTheAverageOfAllReviewsRoundedToTwoPlaces() {
        when(reviewRepository.calculateAverageRating(creator.getId())).thenReturn(4.3333333);
        when(reviewRepository.countByCreatorId(creator.getId())).thenReturn(3L);

        service.rateCreator(elder.getId(), job.getId(), 5, null);

        assertThat(profile.getRating()).isEqualByComparingTo(new BigDecimal("4.33"));
        assertThat(profile.getRatingCount()).isEqualTo(3);
    }

    @Test
    void ratingTheSameJobAgainReplacesTheReviewInsteadOfAddingOne() {
        Review existing = new Review();
        existing.setJob(job);
        existing.setCreator(creator);
        existing.setElder(elder);
        existing.setRating(5);
        when(reviewRepository.findByJobId(job.getId())).thenReturn(Optional.of(existing));
        when(reviewRepository.calculateAverageRating(creator.getId())).thenReturn(2.0);
        when(reviewRepository.countByCreatorId(creator.getId())).thenReturn(1L);

        service.rateCreator(elder.getId(), job.getId(), 2, null);

        verify(reviewRepository).saveAndFlush(existing);
        assertThat(existing.getRating()).isEqualTo(2);
        assertThat(profile.getRating()).isEqualByComparingTo("2.00");
    }

    @Test
    void workThatIsNotCompletedCannotBeRated() {
        job.setStatus(JobStatus.ACTIVE);

        assertThatThrownBy(() -> service.rateCreator(elder.getId(), job.getId(), 5, null))
                .isInstanceOf(InvalidApplicationStateException.class);
        verify(reviewRepository, never()).saveAndFlush(any());
    }

    @Test
    void onlyTheJobsOwnKnowledgeHolderCanRate() {
        assertThatThrownBy(() -> service.rateCreator(UUID.randomUUID(), job.getId(), 5, null))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(reviewRepository, never()).saveAndFlush(any());
    }

    @Test
    void starsOutsideOneToFiveAreRefused() {
        assertThatThrownBy(() -> service.rateCreator(elder.getId(), job.getId(), 0, null))
                .isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> service.rateCreator(elder.getId(), job.getId(), 6, null))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void myReviewIsNullUntilTheyHaveRated() {
        assertThat(service.myReview(elder.getId(), job.getId())).isNull();
    }
}
