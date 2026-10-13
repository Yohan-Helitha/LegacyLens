package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.StudySetAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudySetAttemptRepository extends JpaRepository<StudySetAttempt, Long> {

	boolean existsByOwnerUserIdAndTrackId(UUID ownerUserId, Long trackId);

	long countByOwnerUserIdAndTrackId(UUID ownerUserId, Long trackId);

	List<StudySetAttempt> findByOwnerUserIdAndTrackIdOrderByTakenAtDesc(UUID ownerUserId, Long trackId);

	List<StudySetAttempt> findByOwnerUserIdOrderByTakenAtDesc(UUID ownerUserId);
}
