package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.Review;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    /** Reviews belonging to one creator only — CreatorDashboard never sees anyone else's. */
    List<Review> findByCreatorIdOrderByCreatedAtDesc(UUID creatorId, Pageable pageable);

    Optional<Review> findByJobId(UUID jobId);

    long countByCreatorId(UUID creatorId);

    /** Mean of every star rating this creator has received; null when they have none. */
    @Query("select avg(r.rating) from Review r where r.creator.id = :creatorId")
    Double calculateAverageRating(@Param("creatorId") UUID creatorId);
}
