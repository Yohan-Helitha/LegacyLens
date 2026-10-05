package lk.ac.sliit.legacylens.marketplace.service;

/**
 * One ingredient of a creator's match score. Each factor judges a single
 * question (did they do similar work? have the skills? speak the language?...)
 * and answers with a fraction between 0 and 1; the scorer multiplies that by
 * the factor's weight. Adding or re-weighting a factor never touches the others.
 */
interface MatchFactor {

    /** Share of the 100-point score this factor controls. All weights add up to 100. */
    int weight();

    FactorScore evaluate(MatchContext context);
}
