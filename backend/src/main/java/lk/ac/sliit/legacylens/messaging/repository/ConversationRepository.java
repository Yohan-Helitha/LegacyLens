package lk.ac.sliit.legacylens.messaging.repository;

import lk.ac.sliit.legacylens.messaging.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findByElderIdAndCreatorId(UUID elderId, UUID creatorId);

    /** Every conversation the user is in (as elder or creator), most recently active first. */
    @Query("SELECT c FROM Conversation c WHERE c.elder.id = :userId OR c.creator.id = :userId "
            + "ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC")
    List<Conversation> findAllForUser(@Param("userId") UUID userId);
}
