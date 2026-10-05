package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.ExperienceLevel;

/**
 * 15% - how experienced is the creator, judged against the elder's own track record.
 *
 * An elder who has earned a lot of trust on the platform is a safe place for a
 * newer creator to start, so for them a newcomer scores almost as well as a
 * veteran. An elder with little history is better served by someone proven.
 * The credit slides smoothly between those two ends with the elder's trust:
 *
 * <pre>
 *                         low trust   high trust
 *   New to documentation     0.3         0.9
 *   Some experience          0.7         0.9
 *   Experienced              1.0         1.0
 * </pre>
 *
 * A creator's level is what they declared, raised by the work they have since
 * completed here (1+ jobs: at least "some", 5+ jobs: "experienced").
 */
final class ExperienceFactor implements MatchFactor {

    static final int WEIGHT = 15;
    static final long JOBS_FOR_SOME_EXPERIENCE = 1;
    static final long JOBS_FOR_EXPERIENCED = 5;
    /** Used when the opportunity has no elder, or the elder's trust cannot be read. */
    static final double MIDDLE_TRUST = 0.5;

    @Override
    public int weight() {
        return WEIGHT;
    }

    @Override
    public FactorScore evaluate(MatchContext context) {
        double trust = context.elderTrust() == null ? MIDDLE_TRUST : Math.max(0, Math.min(1, context.elderTrust()));
        ExperienceLevel level = effectiveLevel(context);

        double low;
        double high;
        String reason;
        switch (level) {
            case EXPERIENCED -> { low = 1.0; high = 1.0; reason = "Experienced content creator"; }
            case SOME_EXPERIENCE -> { low = 0.7; high = 0.9; reason = "Has some documentation experience"; }
            default -> { low = 0.3; high = 0.9; reason = trust >= 0.75 ? "Newer creator - a good fit to start with you" : null; }
        }
        return FactorScore.of(low + (high - low) * trust, reason);
    }

    static ExperienceLevel effectiveLevel(MatchContext context) {
        CreatorApplication application = context.candidate().application();
        ExperienceLevel declared = application != null && application.getExperienceLevel() != null
                ? application.getExperienceLevel() : ExperienceLevel.NEW_TO_DOCUMENTATION;
        long jobs = context.candidate().completedJobs();
        ExperienceLevel earned = jobs >= JOBS_FOR_EXPERIENCED ? ExperienceLevel.EXPERIENCED
                : jobs >= JOBS_FOR_SOME_EXPERIENCE ? ExperienceLevel.SOME_EXPERIENCE
                : ExperienceLevel.NEW_TO_DOCUMENTATION;
        return declared.ordinal() >= earned.ordinal() ? declared : earned;
    }
}
