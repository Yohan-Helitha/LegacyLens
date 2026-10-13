package lk.ac.sliit.legacylens.tags.repository;

import lk.ac.sliit.legacylens.tags.entity.RelationshipType;
import lk.ac.sliit.legacylens.tags.entity.TagRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TagRelationshipRepository extends JpaRepository<TagRelationship, UUID> {

    List<TagRelationship> findBySourceTagId(UUID sourceTagId);

    List<TagRelationship> findByTargetTagId(UUID targetTagId);

    @Query("SELECT tr FROM TagRelationship tr WHERE tr.sourceTag.id = :tagId OR tr.targetTag.id = :tagId")
    List<TagRelationship> findAllByTagId(@Param("tagId") UUID tagId);

    @Query("SELECT tr FROM TagRelationship tr WHERE tr.sourceTag.id IN :tagIds OR tr.targetTag.id IN :tagIds")
    List<TagRelationship> findAllByTagIdIn(@Param("tagIds") List<UUID> tagIds);

    Optional<TagRelationship> findBySourceTagIdAndTargetTagIdAndRelationshipType(
            UUID sourceTagId, UUID targetTagId, RelationshipType relationshipType);

    boolean existsBySourceTagIdAndTargetTagIdAndRelationshipType(
            UUID sourceTagId, UUID targetTagId, RelationshipType relationshipType);

    @Query("SELECT tr FROM TagRelationship tr WHERE " +
           "(tr.sourceTag.id = :tagA AND tr.targetTag.id = :tagB) OR " +
           "(tr.sourceTag.id = :tagB AND tr.targetTag.id = :tagA)")
    List<TagRelationship> findBetweenTags(@Param("tagA") UUID tagA, @Param("tagB") UUID tagB);
}

