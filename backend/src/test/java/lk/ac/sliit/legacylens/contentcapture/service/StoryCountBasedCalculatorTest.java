package lk.ac.sliit.legacylens.contentcapture.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StoryCountBasedCalculatorTest {

    private final StoryCountBasedCalculator calculator = new StoryCountBasedCalculator();

    @Test
    void calculate_zeroStories_returnsLevel0() {
        TrustScoreResult result = calculator.calculate(0, 0);

        assertThat(result.getLevel()).isZero();
        assertThat(result.getStoriesToNextLevel()).isEqualTo(3);
    }

    @Test
    void calculate_exactlyAtThreshold_advancesLevel() {
        TrustScoreResult result = calculator.calculate(3, 0);

        assertThat(result.getLevel()).isEqualTo(1);
        assertThat(result.getStoriesToNextLevel()).isEqualTo(3);
    }

    @Test
    void calculate_belowNextThreshold_returnsCorrectRemainingCount() {
        TrustScoreResult result = calculator.calculate(4, 0);

        assertThat(result.getLevel()).isEqualTo(1);
        assertThat(result.getStoriesToNextLevel()).isEqualTo(2);
    }

    @Test
    void calculate_atHighestThreshold_reachesMaxLevelWithNoRemaining() {
        TrustScoreResult result = calculator.calculate(12, 0);

        assertThat(result.getLevel()).isEqualTo(4);
        assertThat(result.getStoriesToNextLevel()).isZero();
    }

    @Test
    void calculate_beyondHighestThreshold_staysAtMaxLevel() {
        TrustScoreResult result = calculator.calculate(20, 0);

        assertThat(result.getLevel()).isEqualTo(4);
        assertThat(result.getStoriesToNextLevel()).isZero();
    }
}
