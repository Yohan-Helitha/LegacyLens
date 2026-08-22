package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByUserIdAndLessonId(
            Long userId,
            Long lessonId
    );

    List<LessonProgress> findByUserId(Long userId);
}