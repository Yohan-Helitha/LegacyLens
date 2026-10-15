package lk.ac.sliit.legacylens.tags.repository;

import lk.ac.sliit.legacylens.tags.entity.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {

    Optional<Tag> findByNormalizedName(String normalizedName);

    boolean existsByNormalizedName(String normalizedName);

    Page<Tag> findByIsApproved(boolean isApproved, Pageable pageable);

    Page<Tag> findByCategory(String category, Pageable pageable);

    Page<Tag> findByCategoryAndIsApproved(String category, boolean isApproved, Pageable pageable);

    @Query("SELECT t FROM Tag t WHERE (:category IS NULL OR t.category = :category) " +
           "AND (:isApproved IS NULL OR t.isApproved = :isApproved) " +
           "AND (LOWER(t.canonicalName) LIKE :pattern OR LOWER(t.normalizedName) LIKE :pattern)")
    Page<Tag> searchWithPattern(@Param("pattern") String pattern,
                                @Param("category") String category,
                                @Param("isApproved") Boolean isApproved,
                                Pageable pageable);

    @Query("SELECT t FROM Tag t WHERE t.normalizedName IN :names")
    List<Tag> findAllByNormalizedNameIn(@Param("names") List<String> names);
}

