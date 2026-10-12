package lk.ac.sliit.legacylens.moderation.repository;

import lk.ac.sliit.legacylens.moderation.entity.StoryQuizOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StoryQuizOptionRepository extends JpaRepository<StoryQuizOption, UUID> {
}
