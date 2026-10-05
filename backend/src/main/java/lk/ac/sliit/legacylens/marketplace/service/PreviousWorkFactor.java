package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;

import java.util.Locale;
import java.util.Set;

/**
 * 30% - has the creator already done work like this? Counts the finished jobs
 * whose subject matches what this opportunity is about. Having none is not
 * zero: a newcomer can still fit through skills, language and location.
 */
final class PreviousWorkFactor implements MatchFactor {

    static final int WEIGHT = 30;

    @Override
    public int weight() {
        return WEIGHT;
    }

    @Override
    public FactorScore evaluate(MatchContext context) {
        OpportunityNeeds needs = context.needs();
        var work = context.candidate().pastWork();

        // Nothing tells us what this opportunity is about, so we cannot tell similar work from other work.
        if (needs.topics().isEmpty()) {
            return FactorScore.of(work.isEmpty() ? 0.10 : 0.35, null);
        }

        int similar = 0;
        int related = 0;
        for (PastWork job : work) {
            String text = job.searchableText();
            Set<ContentTopic> topics = OpportunityNeedsAnalyser.topicsOf(job.category(), text);
            if (topics.stream().anyMatch(needs.topics()::contains)) {
                similar++;
            } else if (mentionsNeededSkill(text, needs)) {
                related++;
            }
        }
        // What the creator wrote about their own experience counts as related work, never as proven work.
        if (describesSimilarExperience(context)) {
            related++;
        }

        if (similar >= 3) return FactorScore.of(0.90, "Has completed " + similar + " similar jobs on LegacyLens");
        if (similar == 2) return FactorScore.of(0.75, "Has completed 2 similar jobs on LegacyLens");
        if (similar == 1) return FactorScore.of(0.55, "Has completed a similar job on LegacyLens");
        if (related > 0) return FactorScore.of(0.35, "Has related experience");
        return FactorScore.of(0.10, null);
    }

    private static boolean mentionsNeededSkill(String lowerText, OpportunityNeeds needs) {
        return needs.mustHave().stream().anyMatch(skill -> skill.matches(lowerText))
                || needs.helpful().stream().anyMatch(skill -> skill.matches(lowerText));
    }

    private static boolean describesSimilarExperience(MatchContext context) {
        CreatorApplication application = context.candidate().application();
        if (application == null || application.getExperienceDescription() == null) {
            return false;
        }
        String text = application.getExperienceDescription().toLowerCase(Locale.ROOT);
        return context.needs().topics().stream().anyMatch(topic -> topic.mentionedIn(text))
                || mentionsNeededSkill(text, context.needs());
    }
}
