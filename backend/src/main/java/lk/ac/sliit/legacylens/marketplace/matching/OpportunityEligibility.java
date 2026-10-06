package lk.ac.sliit.legacylens.marketplace.matching;

import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityCreatorInvitation;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityCreatorInvitationRepository;
import lk.ac.sliit.legacylens.marketplace.matching.CreatorMatchScorer.CreatorCandidate;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.function.Predicate;

/**
 * Decides which opportunities may be recommended to a creator at all - before
 * any percentage is worked out. An opportunity that cannot realistically be
 * taken is not "a low match", it is left out:
 * <ul>
 *   <li>the creator is not an active, verified creator (then nothing is recommended);</li>
 *   <li>the opportunity is no longer open, or its deadline has passed;</li>
 *   <li>it is the creator's own opportunity;</li>
 *   <li>the creator has already applied for it, been invited to it, or been booked for it;</li>
 *   <li>the creator is already booked for something else on the same day.</li>
 * </ul>
 */
@Component
public class OpportunityEligibility {

    private static final Set<JobStatus> COMMITTED_JOB_STATUSES = Set.of(JobStatus.UPCOMING, JobStatus.ACTIVE);

    private final OpportunityApplicationRepository applicationRepository;
    private final OpportunityCreatorInvitationRepository invitationRepository;
    private final JobRepository jobRepository;

    public OpportunityEligibility(
            OpportunityApplicationRepository applicationRepository,
            OpportunityCreatorInvitationRepository invitationRepository,
            JobRepository jobRepository) {

        this.applicationRepository = applicationRepository;
        this.invitationRepository = invitationRepository;
        this.jobRepository = jobRepository;
    }

    /** True when this creator may be shown opportunities at all. */
    public boolean creatorMayBeRecommended(CreatorCandidate creator) {
        return creator.user().getAccountStatus() == AccountStatus.ACTIVE
                && creator.profile() != null
                && creator.profile().getVerificationStatus() == VerificationStatus.VERIFIED;
    }

    /**
     * A test for "may this opportunity be recommended to this creator?". Everything about the
     * creator is read once here, so testing each opportunity afterwards costs nothing.
     */
    public Predicate<Opportunity> forCreator(CreatorCandidate creator, LocalDateTime now) {
        if (!creatorMayBeRecommended(creator)) {
            return opportunity -> false;
        }
        UUID creatorId = creator.user().getId();

        Set<UUID> alreadyInvolved = new HashSet<>();
        for (OpportunityApplication application : applicationRepository.findByCreatorIdOrderBySavedAtDesc(creatorId)) {
            // A saved draft is not a commitment - the creator may still want to see it.
            if (application.getStatus() != OpportunityApplicationStatus.SAVED && application.getOpportunity() != null) {
                alreadyInvolved.add(application.getOpportunity().getId());
            }
        }
        for (OpportunityCreatorInvitation invitation : invitationRepository.findByCreatorId(creatorId)) {
            alreadyInvolved.add(invitation.getOpportunity().getId());
        }

        Set<LocalDate> busyDays = new HashSet<>();
        // All of the creator's committed jobs, not a page of them: a missed one would hide a clash.
        for (Job job : jobRepository.findByCreatorIdAndStatusIn(creatorId, COMMITTED_JOB_STATUSES)) {
            if (job.getOpportunityId() != null) {
                alreadyInvolved.add(job.getOpportunityId());
            }
            if (job.getScheduledAt() != null) {
                busyDays.add(job.getScheduledAt().toLocalDate());
            }
        }

        return opportunity -> opportunity.getStatus() == OpportunityStatus.PUBLISHED
                && (opportunity.getDueAt() == null || !opportunity.getDueAt().isBefore(now))
                && !(opportunity.getElder() != null && opportunity.getElder().getId().equals(creatorId))
                && !alreadyInvolved.contains(opportunity.getId())
                && !(opportunity.getScheduledDate() != null && busyDays.contains(opportunity.getScheduledDate()));
    }
}
