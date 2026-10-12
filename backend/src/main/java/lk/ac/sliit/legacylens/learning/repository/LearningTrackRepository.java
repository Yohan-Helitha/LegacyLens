package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LearningTrackRepository
        extends JpaRepository<LearningTrack, Long> {

    List<LearningTrack> findByOriginAndVisibility(String origin, String visibility);

    List<LearningTrack> findByOriginAndVisibilityOrderByCreatedAtDesc(String origin, String visibility);

    List<LearningTrack> findByOwnerUserIdOrderByCreatedAtDesc(UUID ownerUserId);

    List<LearningTrack> findByOriginAndOwnerUserIdOrderByCreatedAtDesc(String origin, UUID ownerUserId);

    Optional<LearningTrack> findByIdAndOwnerUserId(Long id, UUID ownerUserId);

    @Query("""
        SELECT COUNT(t)
        FROM LearningTrack t
        WHERE t.totalLessons > 0
        AND t.origin = 'ADMIN'
        AND t.visibility = 'PUBLIC'
        AND (
            SELECT COUNT(lp)
            FROM LessonProgress lp
            WHERE lp.userId = :userId
              AND lp.completed = true
              AND lp.lesson.track.id = t.id
        ) = t.totalLessons
    """)
    long countCompletedTracks(@Param("userId") UUID userId);
}