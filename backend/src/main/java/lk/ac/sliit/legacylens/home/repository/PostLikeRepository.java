package lk.ac.sliit.legacylens.home.repository;

import lk.ac.sliit.legacylens.home.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    boolean existsByUserIdentifierAndPostId(String userIdentifier, String postId);

    Optional<PostLike> findByUserIdentifierAndPostId(String userIdentifier, String postId);

    void deleteByUserIdentifierAndPostId(String userIdentifier, String postId);

    List<PostLike> findByUserIdentifier(String userIdentifier);
}

