package lk.ac.sliit.legacylens.contentcapture.repository;

import lk.ac.sliit.legacylens.contentcapture.entity.StoryView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface StoryViewRepository extends JpaRepository<StoryView, UUID> {

    /** True if this viewer already has a recorded view for this story on or after `since`. */
    @Query("SELECT COUNT(v) > 0 FROM StoryView v "
            + "WHERE v.story.id = :storyId AND v.viewerId = :viewerId AND v.viewedAt >= :since")
    boolean existsRecentView(@Param("storyId") UUID storyId, @Param("viewerId") UUID viewerId, @Param("since") LocalDateTime since);
}
