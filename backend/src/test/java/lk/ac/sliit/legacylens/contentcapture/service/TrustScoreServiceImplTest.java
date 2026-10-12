package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.contentcapture.dto.TrustScoreDetailDto;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.stories.repository.StoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrustScoreServiceImplTest {

    private static final UUID USER_ID = UUID.randomUUID();

    @Mock
    private StoryRepository storyRepository;

    @Mock
    private TrustScoreCalculator trustScoreCalculator;

    private TrustScoreServiceImpl trustScoreService;

    @BeforeEach
    void setUp() {
        trustScoreService = new TrustScoreServiceImpl(storyRepository, trustScoreCalculator);
    }

    @Test
    void getDetail_countsOnlyPublishedContent_excludesDraftsAndPending() {
        when(storyRepository.countByAuthorIdAndStatus(USER_ID, StoryStatus.PUBLISHED)).thenReturn(5L);
        when(storyRepository.sumViewCountByAuthorIdAndStatus(USER_ID, StoryStatus.PUBLISHED)).thenReturn(120L);
        when(trustScoreCalculator.calculate(5, 120)).thenReturn(new TrustScoreResult(1, 1));

        TrustScoreDetailDto detail = trustScoreService.getDetail(USER_ID);

        // The service only ever asks the repository for PUBLISHED counts —
        // DRAFT/PENDING stories are never passed to countByAuthorIdAndStatus.
        verify(storyRepository).countByAuthorIdAndStatus(USER_ID, StoryStatus.PUBLISHED);
        assertThat(detail.getStoriesShared()).isEqualTo(5);
        assertThat(detail.getLevel()).isEqualTo(1);
        assertThat(detail.getNextMilestoneStoriesNeeded()).isEqualTo(1);
    }

    @Test
    void getDetail_delegatesScoringToCalculator() {
        when(storyRepository.countByAuthorIdAndStatus(USER_ID, StoryStatus.PUBLISHED)).thenReturn(0L);
        when(storyRepository.sumViewCountByAuthorIdAndStatus(USER_ID, StoryStatus.PUBLISHED)).thenReturn(0L);
        when(trustScoreCalculator.calculate(0, 0)).thenReturn(new TrustScoreResult(0, 3));

        TrustScoreDetailDto detail = trustScoreService.getDetail(USER_ID);

        assertThat(detail.getLevel()).isZero();
        assertThat(detail.getNextMilestoneStoriesNeeded()).isEqualTo(3);
    }
}
