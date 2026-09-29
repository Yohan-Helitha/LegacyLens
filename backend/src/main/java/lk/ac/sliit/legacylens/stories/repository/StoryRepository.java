package lk.ac.sliit.legacylens.stories.repository;

import lk.ac.sliit.legacylens.stories.entity.Story;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StoryRepository extends JpaRepository<Story, UUID>, JpaSpecificationExecutor<Story> {

    /** The author's own stories, newest first — backs the dashboard's "Your Stories" list. */
    List<Story> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    /** Feeds StoryCountBasedCalculator (Feature 6 — trust score). */
    long countByAuthorIdAndStatus(UUID authorId, StoryStatus status);

    /** Feeds StoryCountBasedCalculator (Feature 6 — trust score). */
    @Query("SELECT COALESCE(SUM(s.viewCount), 0) FROM Story s WHERE s.author.id = :authorId AND s.status = :status")
    long sumViewCountByAuthorIdAndStatus(@Param("authorId") UUID authorId, @Param("status") StoryStatus status);

    /**
     * Atomic increment via a native UPDATE (not a read-modify-write through
     * the entity) so concurrent view recordings for the same story never
     * lose an update — see StoryViewTrackingService.
     */
    @Modifying
    @Query(value = "UPDATE stories SET view_count = view_count + 1 WHERE id = :id", nativeQuery = true)
    void incrementViewCount(@Param("id") UUID id);
}
