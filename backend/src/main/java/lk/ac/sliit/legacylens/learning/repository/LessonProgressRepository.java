package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository
        extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByUserIdAndLessonId(
            Long userId,
            Long lessonId
    );

    List<LessonProgress> findByUserId(Long userId);

    long countByUserIdAndCompletedTrue(Long userId);

    long countByUserId(Long userId);

    @Query("""
        SELECT COALESCE(SUM(lp.xpEarned), 0)
        FROM LessonProgress lp
        WHERE lp.userId = :userId
    """)
    long sumXpByUserId(@Param("userId") Long userId);

    long countByUserIdAndLessonTrackIdAndCompletedTrue(
            Long userId,
            Long trackId
    );

    @Query("""
        SELECT COALESCE(SUM(lp.xpEarned), 0)
        FROM LessonProgress lp
        WHERE lp.userId = :userId
          AND lp.lesson.track.id = :trackId
    """)
    long sumXpByUserIdAndTrackId(
            @Param("userId") Long userId,
            @Param("trackId") Long trackId
    );
}