package lk.ac.sliit.legacylens.home.repository;

import lk.ac.sliit.legacylens.home.entity.FeaturedKeeper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeaturedKeeperRepository extends JpaRepository<FeaturedKeeper, Long> {

    Optional<FeaturedKeeper> findByActiveDateAndStatus(LocalDate activeDate, String status);

    Optional<FeaturedKeeper> findFirstByActiveDate(LocalDate activeDate);

    List<FeaturedKeeper> findByStatus(String status);

    List<FeaturedKeeper> findAllByOrderByActiveDateDesc();

    boolean existsByStoryId(String storyId);
}
