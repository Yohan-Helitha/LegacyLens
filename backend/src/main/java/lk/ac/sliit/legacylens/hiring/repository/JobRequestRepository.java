package lk.ac.sliit.legacylens.hiring.repository;

import lk.ac.sliit.legacylens.hiring.dto.JobRequestSummaryDto;
import lk.ac.sliit.legacylens.hiring.entity.JobRequest;
import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobRequestRepository extends JpaRepository<JobRequest, UUID> {

    /** Scopes a request lookup to its owner, so submit/review actions can't act across elders. */
    Optional<JobRequest> findByIdAndElderId(UUID id, UUID elderId);

    /**
     * Joins in each request's applicant count (Feature 9). :status is
     * optional — pass null to return every status.
     */
    @Query("SELECT new lk.ac.sliit.legacylens.hiring.dto.JobRequestSummaryDto("
            + "jr.id, jr.title, jr.status, COUNT(ja), jr.createdAt) "
            + "FROM JobRequest jr LEFT JOIN JobApplication ja ON ja.jobRequest = jr "
            + "WHERE jr.elder.id = :elderId AND (:status IS NULL OR jr.status = :status) "
            + "GROUP BY jr.id, jr.title, jr.status, jr.createdAt "
            + "ORDER BY jr.createdAt DESC")
    List<JobRequestSummaryDto> findSummariesByElderId(@Param("elderId") UUID elderId, @Param("status") JobRequestStatus status);
}
