package lk.ac.sliit.legacylens.marketplace.matching;

/**
 * A factor's verdict.
 *
 * @param fraction  0.0 (no fit) to 1.0 (perfect fit)
 * @param reason    the plain-language "why" the elder sees; null when there is nothing worth saying
 * @param qualifies false when this factor rules the creator out altogether (e.g. no skill for the job)
 * @param strong    false when the creator fits only loosely, which keeps them from being the single best match
 */
record FactorScore(double fraction, String reason, boolean qualifies, boolean strong) {

    static FactorScore of(double fraction, String reason) {
        return new FactorScore(fraction, reason, true, true);
    }
}
