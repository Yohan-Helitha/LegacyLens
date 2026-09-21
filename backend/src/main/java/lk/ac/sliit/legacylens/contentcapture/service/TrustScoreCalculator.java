package lk.ac.sliit.legacylens.contentcapture.service;

/**
 * Pure scoring strategy — no repository/DB access, so it's trivially unit
 * testable and swappable for a different formula later without touching
 * TrustScoreService (Open/Closed: a new formula is a new class implementing
 * this interface, not an edit to an existing one).
 */
public interface TrustScoreCalculator {

    TrustScoreResult calculate(int storiesShared, int totalViews);
}
