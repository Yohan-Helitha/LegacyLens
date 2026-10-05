package lk.ac.sliit.legacylens.marketplace.service;

import java.util.Map;

/**
 * 25% - can the creator do the tasks this opportunity needs? Every needed skill
 * is credited by the best skill the creator has for it: the exact skill counts
 * in full, a close one (a photographer for filming) 70%, a loosely related one
 * 40%. The score is the average over the needed skills.
 *
 * A creator with no skill that helps with any needed task does not qualify at
 * all, and one with no exact skill can be recommended but never be the single
 * best match.
 */
final class SkillsFactor implements MatchFactor {

    static final int WEIGHT = 25;

    /** With nothing inferable about the job, any recognised skill earns only this much. */
    private static final double UNKNOWN_NEED_CREDIT = 0.5;

    @Override
    public int weight() {
        return WEIGHT;
    }

    @Override
    public FactorScore evaluate(MatchContext context) {
        OpportunityNeeds needs = context.needs();
        Map<CreatorSkill, String> have = context.candidate().skillEvidence();

        if (needs.unknownNeed()) {
            return have.isEmpty()
                    ? new FactorScore(0, null, false, false)
                    : new FactorScore(UNKNOWN_NEED_CREDIT, "Skilled in " + have.values().iterator().next(), true, false);
        }

        double total = 0;
        boolean anyExact = false;
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
            anyExact |= best == SkillRelations.EXACT;
            total += best;
        }

        double fraction = needs.mustHave().isEmpty() ? 0 : total / needs.mustHave().size();
        String topic = needs.topics().isEmpty() ? "opportunity" : needs.topics().get(0).label;
        String reason = null;
        if (exactTag != null) {
            reason = "Skilled in " + exactTag + " - needed for this " + topic;
        } else if (relatedTag != null) {
            reason = "Has " + relatedTag + ", which is close to the " + relatedFor.label + " this needs";
        }
        return new FactorScore(fraction, reason, fraction > 0, anyExact);
    }
}
