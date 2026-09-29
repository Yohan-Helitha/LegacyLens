package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.OpportunityChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OpportunityChecklistItemRepository extends JpaRepository<OpportunityChecklistItem, UUID> {

    List<OpportunityChecklistItem> findByOpportunityIdOrderBySortOrderAsc(UUID opportunityId);
}
