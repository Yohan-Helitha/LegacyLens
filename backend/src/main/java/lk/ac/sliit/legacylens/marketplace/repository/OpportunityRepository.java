package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
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
    @EntityGraph(attributePaths = {"elder", "elder.city"})
    List<Opportunity> findByStatusAndUrgentTrueOrderByDueAtAsc(OpportunityStatus status, Pageable pageable);

    /**
     * Backs "Recent Postings" — newest first. The knowledge holder and their city come in the same query,
     * because every card shows them (otherwise each card costs two more trips to the database).
     */
    @EntityGraph(attributePaths = {"elder", "elder.city"})
    List<Opportunity> findByStatusOrderByCreatedAtDesc(OpportunityStatus status, Pageable pageable);

    List<Opportunity> findByStatus(OpportunityStatus status);

    /** An elder's own opportunities in one status, newest first — backs the elder's creator recommendations. */
    List<Opportunity> findByElderIdAndStatusOrderByCreatedAtDesc(UUID elderId, OpportunityStatus status);

    /** A single opportunity's full detail — only if it's actually published. */
    Optional<Opportunity> findByIdAndStatus(UUID id, OpportunityStatus status);

    /**
     * Backs the filter chips (Photography/Writing/Documentation/Nearby) — a
     * null parameter is ignored (matches everything), so callers pass only
     * the filters actually in effect. {@code text} is what the creator typed in the search box: it matches
     * the title, description, location, category or the knowledge holder's name. "Nearby" is resolved by the service
     * into a location string (the creator's own city) before calling this.
     *
     * <p>A filter that is not in effect is passed as an empty string, never null: PostgreSQL cannot work out the
     * type of a null that sits inside LOWER(CONCAT(...)), and the whole search then fails instead of matching.
     */
    @EntityGraph(attributePaths = {"elder", "elder.city"})
    @Query("SELECT o FROM Opportunity o LEFT JOIN o.elder e WHERE o.status = :status "
            + "AND (:category = '' OR LOWER(o.category) LIKE LOWER(CONCAT('%', :category, '%'))) "
            + "AND (:location = '' OR LOWER(o.location) LIKE LOWER(CONCAT('%', :location, '%'))) "
            + "AND (:text = '' OR LOWER(o.title) LIKE LOWER(CONCAT('%', :text, '%')) "
            + "  OR LOWER(o.description) LIKE LOWER(CONCAT('%', :text, '%')) "
            + "  OR LOWER(o.location) LIKE LOWER(CONCAT('%', :text, '%')) "
            + "  OR LOWER(o.category) LIKE LOWER(CONCAT('%', :text, '%')) "
            + "  OR LOWER(e.fullName) LIKE LOWER(CONCAT('%', :text, '%'))) "
            + "ORDER BY o.createdAt DESC")
    List<Opportunity> search(
            @Param("status") OpportunityStatus status,
            @Param("category") String category,
            @Param("location") String location,
            @Param("text") String text,
            Pageable pageable);
}
