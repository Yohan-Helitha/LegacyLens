package lk.ac.sliit.legacylens.messaging.repository;

import lk.ac.sliit.legacylens.messaging.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    /** The latest page of a chat, newest first — the service reverses it into reading order. */
    List<Message> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    /** Older history when the user scrolls up, newest first. */
    List<Message> findByConversationIdAndCreatedAtBeforeOrderByCreatedAtDesc(
            UUID conversationId, LocalDateTime before, Pageable pageable);

    /** Only what arrived since the last poll, in reading order — keeps an open chat cheap to refresh. */
    List<Message> findByConversationIdAndCreatedAtAfterOrderByCreatedAtAsc(UUID conversationId, LocalDateTime after);

    /**
     * Unread counts for many conversations at once, as [conversationId, count]
     * rows: messages from the OTHER person sent after the user last read the chat.
     */
    @Query("SELECT c.id, COUNT(m) FROM Message m JOIN m.conversation c "
            + "WHERE c.id IN :conversationIds AND m.sender.id <> :userId "
            + "AND m.createdAt > COALESCE("
            + "  CASE WHEN c.elder.id = :userId THEN c.elderLastReadAt ELSE c.creatorLastReadAt END, :epoch) "
            + "GROUP BY c.id")
    List<Object[]> countUnreadByConversation(
            @Param("conversationIds") Collection<UUID> conversationIds,
            @Param("userId") UUID userId,
            @Param("epoch") LocalDateTime epoch);
}
