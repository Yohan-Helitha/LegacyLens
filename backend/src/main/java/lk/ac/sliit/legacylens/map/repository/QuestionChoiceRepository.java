package lk.ac.sliit.legacylens.map.repository;

import lk.ac.sliit.legacylens.map.entity.QuestionChoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionChoiceRepository extends JpaRepository<QuestionChoice, Long> {
}
