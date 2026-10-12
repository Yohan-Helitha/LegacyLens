package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LessonProgressRepository
        extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByUserIdAndLessonId(
            UUID userId,
            Long lessonId
    );

    List<LessonProgress> findByUserId(UUID userId);

    long countByUserIdAndCompletedTrue(UUID userId);

    long countByUserId(UUID userId);

    @Query("""
        SELECT COALESCE(SUM(lp.xpEarned), 0)
        FROM LessonProgress lp
        WHERE lp.userId = :userId
    """)
    long sumXpByUserId(@Param("userId") UUID userId);

    long countByUserIdAndLesson_Track_IdAndCompletedTrue(
            UUID userId,
            Long trackId
    );

    @Query("""
        SELECT COALESCE(SUM(lp.xpEarned), 0)
        FROM LessonProgress lp
        WHERE lp.userId = :userId
          AND lp.lesson.track.id = :trackId
    """)
    long sumXpByUserIdAndTrackId(
            @Param("userId") UUID userId,
            @Param("trackId") Long trackId
    );

    @Query("""
        SELECT MAX(lp.completedAt)
        FROM LessonProgress lp
        WHERE lp.userId = :userId
          AND lp.lesson.track.id = :trackId
          AND lp.completed = true
    """)
    java.time.LocalDateTime findLatestCompletionForTrack(
            @Param("userId") UUID userId,
            @Param("trackId") Long trackId
    );
}