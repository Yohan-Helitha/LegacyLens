package lk.ac.sliit.legacylens.tags.repository;

import lk.ac.sliit.legacylens.tags.entity.StoryTag;
import lk.ac.sliit.legacylens.tags.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryTagRepository extends JpaRepository<StoryTag, UUID> {

    List<StoryTag> findByStoryId(UUID storyId);

    List<StoryTag> findByTagId(UUID tagId);

    Optional<StoryTag> findByStoryIdAndTagId(UUID storyId, UUID tagId);

    boolean existsByStoryIdAndTagId(UUID storyId, UUID tagId);

    @Modifying
    @Query("DELETE FROM StoryTag st WHERE st.storyId = :storyId AND st.tag.id = :tagId")
    void deleteByStoryIdAndTagId(@Param("storyId") UUID storyId, @Param("tagId") UUID tagId);

    @Modifying
    @Query("DELETE FROM StoryTag st WHERE st.storyId = :storyId")
    void deleteByStoryId(@Param("storyId") UUID storyId);

    @Query("SELECT st.tag FROM StoryTag st WHERE st.storyId = :storyId")
    List<Tag> findTagsByStoryId(@Param("storyId") UUID storyId);

    @Query("SELECT DISTINCT st.storyId FROM StoryTag st WHERE st.tag.id = :tagId")
    List<UUID> findStoryIdsByTagId(@Param("tagId") UUID tagId);

    @Query("SELECT DISTINCT st.storyId FROM StoryTag st WHERE st.tag.id IN :tagIds")
    List<UUID> findStoryIdsByTagIdIn(@Param("tagIds") List<UUID> tagIds);

    @Query("SELECT st FROM StoryTag st WHERE st.storyId IN :storyIds")
    List<StoryTag> findByStoryIdIn(@Param("storyIds") List<UUID> storyIds);
}

