package lk.ac.sliit.legacylens.contentcapture.repository;

import lk.ac.sliit.legacylens.contentcapture.entity.StoryView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import lk.ac.sliit.legacylens.stories.entity.StoryStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface StoryViewRepository extends JpaRepository<StoryView, UUID> {

    /** True if this viewer already has a recorded view for this story on or after `since`. */
    @Query("SELECT COUNT(v) > 0 FROM StoryView v "
            + "WHERE v.story.id = :storyId AND v.viewerId = :viewerId AND v.viewedAt >= :since")
    boolean existsRecentView(@Param("storyId") UUID storyId, @Param("viewerId") UUID viewerId, @Param("since") LocalDateTime since);

    /** When each recorded view of one story happened, since `since` — bucketed into days/windows by StoryAnalyticsService. */
    @Query("SELECT v.viewedAt FROM StoryView v WHERE v.story.id = :storyId AND v.viewedAt >= :since")
    List<LocalDateTime> findViewTimesSince(@Param("storyId") UUID storyId, @Param("since") LocalDateTime since);

    /** Same, across every story of one author that has the given status — backs the dashboard's trend card. */
    @Query("SELECT v.viewedAt FROM StoryView v WHERE v.story.author.id = :authorId AND v.story.status = :status AND v.viewedAt >= :since")
    List<LocalDateTime> findAuthorViewTimesSince(@Param("authorId") UUID authorId, @Param("status") StoryStatus status, @Param("since") LocalDateTime since);
}
