package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.CreatorCandidate;

/**
 * Everything a factor may look at when judging one creator for one opportunity.
 *
 * @param elderTrust how far the elder who owns the opportunity has earned the
 *                   platform's trust, from 0 (brand new) to 1 (highest level);
 *                   null when it is not known
 * @param audience   who will read the reasons - they are worded for the elder
 *                   ("Skilled in Videography") or for the creator ("You have the skills this needs")
 */
record MatchContext(OpportunityNeeds needs, Opportunity opportunity, CreatorCandidate candidate,
                    Double elderTrust, Audience audience) {

    /** A judgement made for an elder looking at creators. */
    MatchContext(OpportunityNeeds needs, Opportunity opportunity, CreatorCandidate candidate, Double elderTrust) {
        this(needs, opportunity, candidate, elderTrust, Audience.ELDER);
    }

    /** Picks the wording for whoever will read the reason. */
    String say(String forElder, String forCreator) {
        return audience == Audience.CREATOR ? forCreator : forElder;
    }
}
