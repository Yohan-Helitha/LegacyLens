package lk.ac.sliit.legacylens.learning.ai.job;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GenerationJobRepository extends JpaRepository<GenerationJob, Long> {

	Optional<GenerationJob> findByIdAndOwnerUserId(Long id, UUID ownerUserId);

	long countByOwnerUserIdAndCreatedAtAfter(UUID ownerUserId, Instant after);

	List<GenerationJob> findByOwnerUserIdOrderByCreatedAtDesc(UUID ownerUserId);
}
