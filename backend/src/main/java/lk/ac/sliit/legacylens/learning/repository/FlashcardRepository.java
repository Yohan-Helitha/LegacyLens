package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

    List<Flashcard> findByLessonIdOrderByIdAsc(Long lessonId);
}