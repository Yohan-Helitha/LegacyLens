package lk.ac.sliit.legacylens.home.repository;

import lk.ac.sliit.legacylens.home.entity.FeedItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedItemRepository extends JpaRepository<FeedItem, Long> {
}
