package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningTrackRepository extends JpaRepository<LearningTrack, Long> {
}