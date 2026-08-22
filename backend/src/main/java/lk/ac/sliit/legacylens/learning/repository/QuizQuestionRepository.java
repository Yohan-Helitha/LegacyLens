package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByLessonIdOrderByIdAsc(Long lessonId);
    long countByLessonId(Long lessonId);
}