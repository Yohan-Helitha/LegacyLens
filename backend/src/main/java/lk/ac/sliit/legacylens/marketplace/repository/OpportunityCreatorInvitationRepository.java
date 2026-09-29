package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.OpportunityCreatorInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface OpportunityCreatorInvitationRepository extends JpaRepository<OpportunityCreatorInvitation, UUID> {

    /** Every invitation across a set of opportunities — loaded once per recommendations request. */
    List<OpportunityCreatorInvitation> findByOpportunityIdIn(Collection<UUID> opportunityIds);

    List<OpportunityCreatorInvitation> findByOpportunityId(UUID opportunityId);
}
