package lk.ac.sliit.legacylens.contentcapture.service;

import org.springframework.stereotype.Component;

/**
 * Initial trust-score strategy: level rises purely with published-story
 * count, at the milestones from the wireframe (3, 6, 9, 12 stories).
 * totalViews is accepted (per the TrustScoreCalculator contract) but unused
 * by this particular strategy — a future views-weighted strategy can use it
 * without changing the interface.
 */
@Component
public class StoryCountBasedCalculator implements TrustScoreCalculator {

    private static final int[] LEVEL_THRESHOLDS = {3, 6, 9, 12};

    @Override
    public TrustScoreResult calculate(int storiesShared, int totalViews) {
        int level = 0;

        for (int threshold : LEVEL_THRESHOLDS) {
            if (storiesShared >= threshold) {
                level++;
            } else {
                break;
            }
        }

        int storiesToNextLevel = level < LEVEL_THRESHOLDS.length
                ? LEVEL_THRESHOLDS[level] - storiesShared
                : 0;

        return new TrustScoreResult(level, storiesToNextLevel);
    }
}
