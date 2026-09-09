package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.WorkChecklistProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkChecklistProgressRepository extends JpaRepository<WorkChecklistProgress, UUID> {

    List<WorkChecklistProgress> findByJobIdOrderByChecklistItem_SortOrderAsc(UUID jobId);

    Optional<WorkChecklistProgress> findByJobIdAndChecklistItemId(UUID jobId, UUID checklistItemId);

    boolean existsByJobIdAndChecklistItemId(UUID jobId, UUID checklistItemId);

    void deleteByJobId(UUID jobId);
}
