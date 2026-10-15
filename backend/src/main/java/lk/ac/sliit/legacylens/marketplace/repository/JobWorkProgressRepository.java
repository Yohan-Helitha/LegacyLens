package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobWorkProgressRepository extends JpaRepository<JobWorkProgress, UUID> {

    Optional<JobWorkProgress> findByJobId(UUID jobId);

    /** Work both reviewers approved that is not in the users' feed yet. */
    List<JobWorkProgress> findByJobStatusAndPublishedStoryIdIsNull(lk.ac.sliit.legacylens.marketplace.entity.JobStatus status);

    List<JobWorkProgress> findByJobIdIn(java.util.Collection<UUID> jobIds);

    /** Rejected submissions the creator has not looked at yet - the number on the menu. */
    long countByJobCreatorIdAndRejectedTrueAndRejectionSeenAtIsNull(UUID creatorId);

    List<JobWorkProgress> findByJobCreatorIdAndRejectedTrueAndRejectionSeenAtIsNull(UUID creatorId);

    /** Every piece of work a knowledge holder was sent for review, newest first - drafts are still the creator's own. */
    List<JobWorkProgress> findByJobElderIdAndSubmittedAtIsNotNullAndDraftFalseOrderBySubmittedAtDesc(UUID elderId);

    /** Every submitted piece of work across all knowledge holders, newest first - the admin's review queue. */
    List<JobWorkProgress> findBySubmittedAtIsNotNullAndDraftFalseOrderBySubmittedAtDesc();
}
