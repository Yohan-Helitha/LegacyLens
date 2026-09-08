package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.JobWorkMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobWorkMaterialRepository extends JpaRepository<JobWorkMaterial, UUID> {

    List<JobWorkMaterial> findByJobIdOrderByUploadedAtAsc(UUID jobId);

    /** Ownership is enforced by callers going through the owning Job first — this just scopes deletion to the expected job. */
    Optional<JobWorkMaterial> findByIdAndJobId(UUID id, UUID jobId);

    void deleteByJobId(UUID jobId);
}
