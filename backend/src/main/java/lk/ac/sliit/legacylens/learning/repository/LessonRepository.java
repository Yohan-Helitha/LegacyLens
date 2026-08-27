package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

    
    List<Lesson> findByTrackIdOrderByLessonOrderAsc(Long trackId);

     long countByTrackId(Long trackId);
     
    boolean existsByTrackIdAndLessonOrder(
            Long trackId,
            Integer lessonOrder
    );
}