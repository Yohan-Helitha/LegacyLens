package lk.ac.sliit.legacylens.home.repository;

import lk.ac.sliit.legacylens.home.entity.FeedItemComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedItemCommentRepository extends JpaRepository<FeedItemComment, Long> {
    List<FeedItemComment> findByFeedItemIdOrderByCreatedAtDesc(Long feedItemId);
}
