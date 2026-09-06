package lk.ac.sliit.legacylens.map.repository;

import lk.ac.sliit.legacylens.map.entity.UserQuestProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserQuestProgressRepository extends JpaRepository<UserQuestProgress, Long> {
    Optional<UserQuestProgress> findByUserIdAndQuestId(UUID userId, Long questId);
}
