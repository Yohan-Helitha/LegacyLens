package lk.ac.sliit.legacylens.map.repository;

import lk.ac.sliit.legacylens.map.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {
    Optional<Badge> findByBadgeCode(String badgeCode);
    java.util.List<Badge> findAllByOrderByIdAsc();
}
