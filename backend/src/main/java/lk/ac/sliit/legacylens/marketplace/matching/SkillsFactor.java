package lk.ac.sliit.legacylens.marketplace.matching;

import java.util.Map;

/**
 * Can the creator do the tasks this opportunity needs? Every needed skill is
 * credited by the best skill the creator has for it: the exact skill counts in
 * full, a close one (a photographer for filming) 70%, a loosely related one
 * 40%. The score is the average over the needed skills.
 *
 * A creator with no skill that helps with any needed task does not qualify at
 * all, and one with no exact skill can be recommended but never be the single
 * best match.
 */
final class SkillsFactor implements MatchFactor {

    /** With nothing inferable about the job, any recognised skill earns only this much. */
    private static final double UNKNOWN_NEED_CREDIT = 0.5;

    private final int weight;

    SkillsFactor(int weight) {
        this.weight = weight;
    }

    @Override
    public int weight() {
        return weight;
    }

    @Override
    public FactorScore evaluate(MatchContext context) {
        OpportunityNeeds needs = context.needs();
        Map<CreatorSkill, String> have = context.candidate().skillEvidence();

        if (needs.unknownNeed()) {
            if (have.isEmpty()) {
                return new FactorScore(0, null, false, false);
            }
            String first = have.values().iterator().next();
            return new FactorScore(UNKNOWN_NEED_CREDIT,
                    context.say("Skilled in " + first, "Uses your skill in " + first), true, false);
        }

        double total = 0;
        int exactCount = 0;
        String exactTag = null;
        String relatedTag = null;
        CreatorSkill relatedFor = null;

        for (CreatorSkill needed : needs.mustHave()) {
            double best = 0;
            for (Map.Entry<CreatorSkill, String> owned : have.entrySet()) {
                double credit = SkillRelations.credit(needed, owned.getKey());
                if (credit > best) {
                    best = credit;
                    if (credit == SkillRelations.EXACT) {
                        if (exactTag == null) exactTag = owned.getValue();
                    } else if (relatedTag == null) {
                        relatedTag = owned.getValue();
                        relatedFor = needed;
                    }
                }
            }
            if (best == SkillRelations.EXACT) exactCount++;
            total += best;
        }

        int needed = needs.mustHave().size();
        double fraction = needed == 0 ? 0 : total / needed;
        String topic = needs.topics().isEmpty() ? "opportunity" : needs.topics().get(0).label;

        String reason = null;
        if (exactCount > 0) {
            String creatorSays = exactCount == needed
                    ? (needed == 1 ? "You have the skill this needs" : "You have all " + needed + " skills this needs")
                    : "You have " + exactCount + " of the " + needed + " skills this needs";
            reason = context.say("Skilled in " + exactTag + " - needed for this " + topic, creatorSays);
        } else if (relatedTag != null) {
            reason = context.say(
                    "Has " + relatedTag + ", which is close to the " + relatedFor.label + " this needs",
                    "Your " + relatedTag + " is close to the " + relatedFor.label + " this needs");
        }
        return new FactorScore(fraction, reason, fraction > 0, exactCount > 0);
    }
}
