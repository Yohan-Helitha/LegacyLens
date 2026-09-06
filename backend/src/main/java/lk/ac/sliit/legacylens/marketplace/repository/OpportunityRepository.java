package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OpportunityRepository extends JpaRepository<Opportunity, UUID> {

    /** Backs "Recommended For You" — highest match score first. */
    @Query("SELECT o FROM Opportunity o WHERE o.status = :status ORDER BY o.matchPercentage DESC NULLS LAST, o.createdAt DESC")
    List<Opportunity> findRecommended(@Param("status") OpportunityStatus status, Pageable pageable);

    /** Backs "Urgent Missions" — soonest deadline first. */
    List<Opportunity> findByStatusAndUrgentTrueOrderByDueAtAsc(OpportunityStatus status, Pageable pageable);

    /** Backs "Recent Postings" — newest first. */
    List<Opportunity> findByStatusOrderByCreatedAtDesc(OpportunityStatus status, Pageable pageable);

    /** A single opportunity's full detail — only if it's actually published. */
    Optional<Opportunity> findByIdAndStatus(UUID id, OpportunityStatus status);

    /**
     * Backs the filter chips (Photography/Writing/Documentation/Nearby) — a
     * null parameter is ignored (matches everything), so callers pass only
     * the filters actually in effect. "Nearby" is resolved by the service
     * into a location string (the creator's own city) before calling this.
     */
    @Query("SELECT o FROM Opportunity o WHERE o.status = :status "
            + "AND (:category IS NULL OR LOWER(o.category) LIKE LOWER(CONCAT('%', :category, '%'))) "
            + "AND (:location IS NULL OR LOWER(o.location) LIKE LOWER(CONCAT('%', :location, '%'))) "
            + "ORDER BY o.createdAt DESC")
    List<Opportunity> search(
            @Param("status") OpportunityStatus status,
            @Param("category") String category,
            @Param("location") String location,
            Pageable pageable);
}
