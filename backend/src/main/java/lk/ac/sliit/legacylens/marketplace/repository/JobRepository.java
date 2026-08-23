package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {

    /** Backs both the Active/Upcoming/Completed tabs and "recent work" — the
     * caller supplies sort order and page size via Pageable. */
    List<Job> findByCreatorIdAndStatus(UUID creatorId, JobStatus status, Pageable pageable);

    long countByCreatorIdAndStatus(UUID creatorId, JobStatus status);

    /** Available balance: total earned from completed jobs. See JobStatus's
     * javadoc — nothing here yet excludes jobs already settled in cash,
     * since that tracking doesn't exist until the work-progress page ships. */
    @Query("SELECT COALESCE(SUM(j.offeredAmount), 0) FROM Job j WHERE j.creator.id = :creatorId AND j.status = :status")
    BigDecimal sumOfferedAmountByCreatorIdAndStatus(@Param("creatorId") UUID creatorId, @Param("status") JobStatus status);

    /** "Contributions" on the dashboard — the number of distinct elders this creator has completed work for. */
    @Query("SELECT COUNT(DISTINCT j.elder.id) FROM Job j WHERE j.creator.id = :creatorId AND j.status = :status")
    long countDistinctEldersByCreatorIdAndStatus(@Param("creatorId") UUID creatorId, @Param("status") JobStatus status);
}
