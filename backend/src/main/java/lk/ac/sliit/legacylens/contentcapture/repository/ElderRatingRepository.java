package lk.ac.sliit.legacylens.contentcapture.repository;

import lk.ac.sliit.legacylens.contentcapture.entity.ElderRating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ElderRatingRepository extends JpaRepository<ElderRating, UUID> {

    /** Fetch-joins the reviewer so ReviewQueryService can read their name/avatar without N+1 queries. */
    @Query(value = "SELECT r FROM ElderRating r JOIN FETCH r.ratedBy WHERE r.elder.id = :elderId ORDER BY r.createdAt DESC",
            countQuery = "SELECT COUNT(r) FROM ElderRating r WHERE r.elder.id = :elderId")
    Page<ElderRating> findByElderIdOrderByCreatedAtDesc(@Param("elderId") UUID elderId, Pageable pageable);

    @Query("SELECT AVG(r.score) FROM ElderRating r WHERE r.elder.id = :elderId")
    Double calculateAverageScore(@Param("elderId") UUID elderId);

    long countByElderId(UUID elderId);
}
