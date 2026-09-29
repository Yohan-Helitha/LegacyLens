package lk.ac.sliit.legacylens.hiring.repository;

import lk.ac.sliit.legacylens.hiring.entity.JobApplication;
import lk.ac.sliit.legacylens.hiring.entity.JobApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {

    List<JobApplication> findByJobRequestIdOrderByAppliedAtDesc(UUID jobRequestId);

    /** Scopes an application lookup to its parent request, so approve/reject can't act across job requests. */
    Optional<JobApplication> findByIdAndJobRequestId(UUID id, UUID jobRequestId);

    List<JobApplication> findByJobRequestIdAndStatus(UUID jobRequestId, JobApplicationStatus status);

    long countByJobRequestId(UUID jobRequestId);
}
