package lk.ac.sliit.legacylens.map.repository;

import lk.ac.sliit.legacylens.map.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByQuestId(Long questId);
}
