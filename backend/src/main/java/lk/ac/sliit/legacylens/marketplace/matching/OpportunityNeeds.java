package lk.ac.sliit.legacylens.marketplace.matching;

import lk.ac.sliit.legacylens.users.entity.City;

import java.util.List;
import java.util.Set;

/**
 * What one opportunity needs, worked out once and reused for every creator.
 *
 * @param mustHave    skills the job cannot be done without (at least one must be covered)
 * @param helpful     skills that add value but can't carry the job alone
 * @param topics      what the opportunity is about — drives the interest points
 * @param fromAdmin   true when mustHave came from the admin's Required Skills
 * @param unknownNeed true when nothing could be inferred — any skill earns partial credit only
 * @param city        the opportunity's city, when its location names a known city
 * @param remote      true for "Remote OK" opportunities — location stops mattering
 */
public record OpportunityNeeds(
        Set<CreatorSkill> mustHave,
        Set<CreatorSkill> helpful,
        List<ContentTopic> topics,
        boolean fromAdmin,
        boolean unknownNeed,
        City city,
        boolean remote) {
}
