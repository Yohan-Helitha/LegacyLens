package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.contentcapture.entity.ElderRating;
import lk.ac.sliit.legacylens.contentcapture.repository.ElderRatingRepository;
import lk.ac.sliit.legacylens.users.entity.KnowledgeHolderProfile;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.KnowledgeHolderProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RatingServiceImplTest {

    private static final UUID ELDER_ID = UUID.randomUUID();
    private static final UUID RATER_ID = UUID.randomUUID();

    @Mock
    private ElderRatingRepository elderRatingRepository;

    @Mock
    private KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;

    @Mock
    private UserRepository userRepository;

    private RatingServiceImpl ratingService;

    @BeforeEach
    void setUp() {
        ratingService = new RatingServiceImpl(elderRatingRepository, knowledgeHolderProfileRepository, userRepository);
    }

    private User buildUser(UUID id) {
        User user = new User();
        user.setId(id);
        user.setFullName("Some User");
        return user;
    }

    @Test
    void submitRating_selfRating_throwsValidationException() {
        assertThrows(InvalidRequestException.class,
                () -> ratingService.submitRating(ELDER_ID, ELDER_ID, 5, "Nice"));

        verify(elderRatingRepository, never()).save(any());
    }

    @Test
    void submitRating_validRating_updatesAverageAndCount() {
        KnowledgeHolderProfile profile = new KnowledgeHolderProfile();
        when(knowledgeHolderProfileRepository.findByUserId(ELDER_ID)).thenReturn(Optional.of(profile));
        when(userRepository.findById(ELDER_ID)).thenReturn(Optional.of(buildUser(ELDER_ID)));
        when(userRepository.findById(RATER_ID)).thenReturn(Optional.of(buildUser(RATER_ID)));
        when(elderRatingRepository.calculateAverageScore(ELDER_ID)).thenReturn(4.5);
        when(elderRatingRepository.countByElderId(ELDER_ID)).thenReturn(2L);

        ratingService.submitRating(ELDER_ID, RATER_ID, 5, "Great storyteller");

        ArgumentCaptor<ElderRating> ratingCaptor = ArgumentCaptor.forClass(ElderRating.class);
        verify(elderRatingRepository).save(ratingCaptor.capture());
        assertThat(ratingCaptor.getValue().getScore()).isEqualTo(5);
        assertThat(ratingCaptor.getValue().getComment()).isEqualTo("Great storyteller");

        ArgumentCaptor<KnowledgeHolderProfile> profileCaptor = ArgumentCaptor.forClass(KnowledgeHolderProfile.class);
        verify(knowledgeHolderProfileRepository).save(profileCaptor.capture());
        assertThat(profileCaptor.getValue().getAverageRating()).isEqualByComparingTo(new BigDecimal("4.50"));
        assertThat(profileCaptor.getValue().getRatingCount()).isEqualTo(2);
    }

    @Test
    void submitRating_firstRatingEver_averageEqualsScore() {
        KnowledgeHolderProfile profile = new KnowledgeHolderProfile();
        when(knowledgeHolderProfileRepository.findByUserId(ELDER_ID)).thenReturn(Optional.of(profile));
        when(userRepository.findById(ELDER_ID)).thenReturn(Optional.of(buildUser(ELDER_ID)));
        when(userRepository.findById(RATER_ID)).thenReturn(Optional.of(buildUser(RATER_ID)));
        when(elderRatingRepository.calculateAverageScore(ELDER_ID)).thenReturn(5.0);
        when(elderRatingRepository.countByElderId(ELDER_ID)).thenReturn(1L);

        ratingService.submitRating(ELDER_ID, RATER_ID, 5, null);

        ArgumentCaptor<KnowledgeHolderProfile> profileCaptor = ArgumentCaptor.forClass(KnowledgeHolderProfile.class);
        verify(knowledgeHolderProfileRepository).save(profileCaptor.capture());
        assertThat(profileCaptor.getValue().getAverageRating()).isEqualByComparingTo(new BigDecimal("5.00"));
        assertThat(profileCaptor.getValue().getRatingCount()).isEqualTo(1);
    }

    @Test
    void submitRating_elderHasNoKnowledgeHolderProfile_throwsResourceNotFound() {
        when(knowledgeHolderProfileRepository.findByUserId(ELDER_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> ratingService.submitRating(ELDER_ID, RATER_ID, 5, "Nice"));

        verify(elderRatingRepository, never()).save(any());
    }
}
