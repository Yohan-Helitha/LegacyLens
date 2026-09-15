package lk.ac.sliit.legacylens.map.repository;

import lk.ac.sliit.legacylens.map.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUserId(UUID userId);
    boolean existsByUserIdAndBadgeId(UUID userId, Long badgeId);
}
