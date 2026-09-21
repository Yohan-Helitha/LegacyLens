package lk.ac.sliit.legacylens.contentcapture.service;

/** Output of a TrustScoreCalculator strategy. Immutable value type. */
public final class TrustScoreResult {

    private final int level;
    private final int storiesToNextLevel;

    public TrustScoreResult(int level, int storiesToNextLevel) {
        this.level = level;
        this.storiesToNextLevel = storiesToNextLevel;
    }

    public int getLevel() {
        return level;
    }

    /** 0 once the elder has reached the highest defined level. */
    public int getStoriesToNextLevel() {
        return storiesToNextLevel;
    }
}
