package lk.ac.sliit.legacylens.moderation.repository;

import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.entity.ModerationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ModerationQueueRepository extends JpaRepository<ModerationQueueItem, UUID> {

    List<ModerationQueueItem> findByStatus(ModerationStatus status);

    List<ModerationQueueItem> findByStatusAndType(ModerationStatus status, String type);

    Optional<ModerationQueueItem> findByIdAndStatus(UUID id, ModerationStatus status);

    @Query("""
            SELECT s FROM ModerationQueueItem s LEFT JOIN s.author a
            WHERE (:status IS NULL OR s.status = :status)
              AND (:type IS NULL OR s.type = :type)
              AND (
                  :query IS NULL
                  OR LOWER(s.title) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(s.description) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR (a IS NOT NULL AND LOWER(a.fullName) LIKE LOWER(CONCAT('%', :query, '%')))
              )
            """)
    List<ModerationQueueItem> search(
            @Param("status") ModerationStatus status,
            @Param("type") String type,
            @Param("query") String query);
}
