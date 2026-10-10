package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OpportunityApplicationRepository extends JpaRepository<OpportunityApplication, UUID> {

    /** Backs SavedOpportunityApplication's Saved + Submitted sections, most recent first. */
    List<OpportunityApplication> findByCreatorIdOrderBySavedAtDesc(UUID creatorId);

    /** One creator applies to a given opportunity at most once — used to upsert on Save. */
    Optional<OpportunityApplication> findByCreatorIdAndOpportunityId(UUID creatorId, UUID opportunityId);

    /** Ownership-scoped lookup for submit/delete — a creator may only act on their own application. */
    Optional<OpportunityApplication> findByIdAndCreatorId(UUID id, UUID creatorId);

    /** Every application across a set of opportunities — loaded once per creator-recommendations request. */
    List<OpportunityApplication> findByOpportunityIdIn(Collection<UUID> opportunityIds);

    List<OpportunityApplication> findByOpportunityId(UUID opportunityId);

    /** What an elder reviews: applications to their own opportunities, newest first. Drafts are never included. */
    List<OpportunityApplication> findByOpportunityElderIdAndStatusInOrderBySubmittedAtDesc(
            UUID elderId, Collection<OpportunityApplicationStatus> statuses);

    /** Ownership-scoped lookup for the elder decision - only the elder who owns the opportunity can find the application. */
    Optional<OpportunityApplication> findByIdAndOpportunityElderId(UUID id, UUID elderId);

    /** How many of a creator's applications are in any of these states - backs the profile's "Approved" count. */
    long countByCreatorIdAndStatusIn(UUID creatorId, Collection<OpportunityApplicationStatus> statuses);
}
