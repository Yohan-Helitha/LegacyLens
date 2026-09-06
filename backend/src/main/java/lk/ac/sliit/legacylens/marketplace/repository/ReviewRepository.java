package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.Review;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    /** Reviews belonging to one creator only — CreatorDashboard never sees anyone else's. */
    List<Review> findByCreatorIdOrderByCreatedAtDesc(UUID creatorId, Pageable pageable);
}
