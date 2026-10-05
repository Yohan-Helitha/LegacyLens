package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.CreatorCandidate;

/**
 * Everything a factor may look at when judging one creator for one opportunity.
 *
 * @param elderTrust how far the elder who owns the opportunity has earned the
 *                   platform's trust, from 0 (brand new) to 1 (highest level);
 *                   null when it is not known
 */
record MatchContext(OpportunityNeeds needs, Opportunity opportunity, CreatorCandidate candidate, Double elderTrust) {
}
