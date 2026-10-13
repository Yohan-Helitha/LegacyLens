package lk.ac.sliit.legacylens.tags.repository;

import lk.ac.sliit.legacylens.tags.entity.Tag;
import lk.ac.sliit.legacylens.tags.entity.TagAlias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TagAliasRepository extends JpaRepository<TagAlias, UUID> {

    Optional<TagAlias> findByNormalizedAlias(String normalizedAlias);

    boolean existsByNormalizedAlias(String normalizedAlias);

    List<TagAlias> findByTagId(UUID tagId);

    List<TagAlias> findByTag(Tag tag);

    @Query("SELECT ta FROM TagAlias ta WHERE ta.normalizedAlias IN :aliases")
    List<TagAlias> findAllByNormalizedAliasIn(@Param("aliases") List<String> aliases);

    void deleteByTagId(UUID tagId);
}

