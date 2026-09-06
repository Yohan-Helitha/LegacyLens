package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
