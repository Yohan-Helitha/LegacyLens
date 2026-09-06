package lk.ac.sliit.legacylens.home.repository;

import lk.ac.sliit.legacylens.home.entity.FeaturedKeeper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeaturedKeeperRepository extends JpaRepository<FeaturedKeeper, Long> {
}
