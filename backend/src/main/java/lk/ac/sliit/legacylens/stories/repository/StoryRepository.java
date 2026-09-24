package lk.ac.sliit.legacylens.stories.repository;

import lk.ac.sliit.legacylens.stories.entity.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StoryRepository extends JpaRepository<Story, UUID> {

    /** The author's own stories, newest first — backs the dashboard's "Your Stories" list. */
    List<Story> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);
}
