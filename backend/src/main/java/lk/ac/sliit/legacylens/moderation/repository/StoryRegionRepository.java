package lk.ac.sliit.legacylens.moderation.repository;

import lk.ac.sliit.legacylens.moderation.entity.StoryRegion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryRegionRepository extends JpaRepository<StoryRegion, UUID> {
    Optional<StoryRegion> findByStoryId(UUID storyId);
    List<StoryRegion> findByRegion(String region);
    List<StoryRegion> findByDistrict(String district);
    void deleteByStoryId(UUID storyId);
}

