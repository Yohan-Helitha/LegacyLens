package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LearningTrackRepository
        extends JpaRepository<LearningTrack, Long> {

    @Query("""
        SELECT COUNT(t)
        FROM LearningTrack t
        WHERE t.totalLessons > 0
        AND (
            SELECT COUNT(lp)
            FROM LessonProgress lp
            WHERE lp.userId = :userId
              AND lp.completed = true
              AND lp.lesson.track.id = t.id
        ) = t.totalLessons
    """)
    long countCompletedTracks(@Param("userId") Long userId);
}