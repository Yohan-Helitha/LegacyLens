package lk.ac.sliit.legacylens.map.repository;

import lk.ac.sliit.legacylens.map.entity.Quest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestRepository extends JpaRepository<Quest, Long> {
    List<Quest> findByLandmarkId(Long landmarkId);
}
