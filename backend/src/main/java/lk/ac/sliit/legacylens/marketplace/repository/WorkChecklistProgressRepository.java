package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.WorkChecklistProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkChecklistProgressRepository extends JpaRepository<WorkChecklistProgress, UUID> {

    List<WorkChecklistProgress> findByJobIdOrderByChecklistItem_SortOrderAsc(UUID jobId);

    /** One job's checklist rows with each task already loaded - no extra query per task. */
    @Query("select cp from WorkChecklistProgress cp join fetch cp.checklistItem where cp.job.id = :jobId")
    List<WorkChecklistProgress> findWithItemByJobId(@Param("jobId") UUID jobId);

    /** Every checklist row of many jobs, tasks included, in a single query. */
    @Query("select cp from WorkChecklistProgress cp join fetch cp.checklistItem where cp.job.id in :jobIds")
    List<WorkChecklistProgress> findWithItemByJobIdIn(@Param("jobIds") Collection<UUID> jobIds);

    Optional<WorkChecklistProgress> findByJobIdAndChecklistItemId(UUID jobId, UUID checklistItemId);

    boolean existsByJobIdAndChecklistItemId(UUID jobId, UUID checklistItemId);

    void deleteByJobId(UUID jobId);
}
