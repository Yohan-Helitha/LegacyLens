package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobWorkProgressRepository extends JpaRepository<JobWorkProgress, UUID> {

    Optional<JobWorkProgress> findByJobId(UUID jobId);
}
