package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.contentcapture.dto.TrustScoreDetailDto;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.stories.repository.StoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Orchestrates "get the numbers, then do the math" — fetches published-story
 * counts via the repository and delegates the actual scoring formula to the
 * injected TrustScoreCalculator. Never contains the formula itself (Single
 * Responsibility split between "get the numbers" and "do the math").
 */
@Service
public class TrustScoreServiceImpl implements TrustScoreService {

    private final StoryRepository storyRepository;
    private final TrustScoreCalculator trustScoreCalculator;

    public TrustScoreServiceImpl(StoryRepository storyRepository, TrustScoreCalculator trustScoreCalculator) {
        this.storyRepository = storyRepository;
        this.trustScoreCalculator = trustScoreCalculator;
    }

    @Override
    @Transactional(readOnly = true)
    public TrustScoreDetailDto getDetail(UUID userId) {
        long storiesShared = storyRepository.countByAuthorIdAndStatus(userId, StoryStatus.PUBLISHED);
        long totalViews = storyRepository.sumViewCountByAuthorIdAndStatus(userId, StoryStatus.PUBLISHED);

        TrustScoreResult result = trustScoreCalculator.calculate((int) storiesShared, (int) totalViews);

        return TrustScoreDetailDto.builder()
                .level(result.getLevel())
                .storiesShared((int) storiesShared)
                .nextMilestoneStoriesNeeded(result.getStoriesToNextLevel())
                .build();
    }
}
