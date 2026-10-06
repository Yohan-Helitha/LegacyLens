package lk.ac.sliit.legacylens.marketplace.matching;

/**
 * How to describe a match percentage. Below 30% an opportunity is simply not
 * recommended; 100% is possible but extremely rare, because every factor
 * would have to be perfect.
 */
public enum MatchLevel {
    NOT_RECOMMENDED,   // 0-29
    WEAK,              // 30-49
    GOOD_POTENTIAL,    // 50-69
    STRONG,            // 70-84
    EXCELLENT;         // 85-100

    public static MatchLevel of(int percentage) {
        if (percentage < 30) return NOT_RECOMMENDED;
        if (percentage < 50) return WEAK;
        if (percentage < 70) return GOOD_POTENTIAL;
        if (percentage < 85) return STRONG;
        return EXCELLENT;
    }
}
